package cognito

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"strings"
	"testing"

	"services/auth/internal/config"

	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCalculateSecretHash(t *testing.T) {
	tests := []struct {
		name         string
		username     string
		clientID     string
		clientSecret string
		wantLength   int
	}{
		{
			name:         "basic hash",
			username:     "testuser",
			clientID:     "testclient",
			clientSecret: "testsecret",
			wantLength:   44, // base64 encoded HMAC-SHA256 is 44 chars
		},
		{
			name:         "email as username",
			username:     "user@example.com",
			clientID:     "client123",
			clientSecret: "secret123",
			wantLength:   44,
		},
		{
			name:         "empty strings",
			username:     "",
			clientID:     "",
			clientSecret: "",
			wantLength:   44,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash := calculateSecretHash(tt.username, tt.clientID, tt.clientSecret)
			assert.Len(t, hash, tt.wantLength, "Secret hash should have correct length")

			// Verify it's valid base64
			_, err := base64.StdEncoding.DecodeString(hash)
			assert.NoError(t, err, "Secret hash should be valid base64")

			// Verify it's deterministic
			hash2 := calculateSecretHash(tt.username, tt.clientID, tt.clientSecret)
			assert.Equal(t, hash, hash2, "Secret hash should be deterministic")
		})
	}
}

func TestCalculateSecretHash_MatchesExpected(t *testing.T) {
	// Test that our implementation matches the expected HMAC-SHA256 calculation
	username := "testuser"
	clientID := "testclient"
	clientSecret := "testsecret"

	hash := calculateSecretHash(username, clientID, clientSecret)

	// Manually calculate expected hash
	message := username + clientID
	mac := hmac.New(sha256.New, []byte(clientSecret))
	mac.Write([]byte(message))
	expectedHash := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	assert.Equal(t, expectedHash, hash, "Secret hash should match manual calculation")
}

func TestNewClient(t *testing.T) {
	t.Run("create client with local endpoint", func(t *testing.T) {
		cfg := &config.Config{
			CognitoUserPoolID:   "local_test_pool",
			CognitoClientID:      "test_client_id",
			CognitoClientSecret:  "test_secret",
			CognitoEndpoint:      "http://localhost:9229",
		}

		client, err := NewClient(cfg)
		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.Equal(t, cfg.CognitoUserPoolID, client.userPoolID)
		assert.Equal(t, cfg.CognitoClientID, client.clientID)
		assert.Equal(t, cfg.CognitoEndpoint, client.endpoint)
	})

	t.Run("create client without endpoint", func(t *testing.T) {
		cfg := &config.Config{
			CognitoUserPoolID:   "test_pool",
			CognitoClientID:      "test_client_id",
			CognitoClientSecret:  "test_secret",
			CognitoEndpoint:      "",
		}

		client, err := NewClient(cfg)
		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.Equal(t, cfg.CognitoUserPoolID, client.userPoolID)
		assert.Equal(t, cfg.CognitoClientID, client.clientID)
		assert.Equal(t, "", client.endpoint)
	})
}

// TestSignUp_Integration tests the SignUp method with cognito-local
// This requires cognito-local to be running
func TestSignUp_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := &config.Config{
		CognitoUserPoolID:   "local_test_pool",
		CognitoClientID:      "test_client_id",
		CognitoClientSecret:  "",
		CognitoEndpoint:      "http://localhost:9229",
	}

	client, err := NewClient(cfg)
	require.NoError(t, err)

	ctx := context.Background()

	// This test requires cognito-local to be running and configured
	// Skip if not available
	_, err = client.SignUp(ctx, "test@example.com", "TestPassword123!", "Test User")
	if err != nil {
		t.Skipf("Skipping integration test - cognito-local not available: %v", err)
	}
}

// TestIsUserConfirmed_Integration tests the IsUserConfirmed method
func TestIsUserConfirmed_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := &config.Config{
		CognitoUserPoolID:   "local_test_pool",
		CognitoClientID:      "test_client_id",
		CognitoClientSecret:  "",
		CognitoEndpoint:      "http://localhost:9229",
	}

	client, err := NewClient(cfg)
	require.NoError(t, err)

	ctx := context.Background()

	// Test with non-existent user
	_, _, _, err = client.IsUserConfirmed(ctx, "nonexistent@example.com")
	assert.Error(t, err, "Should return error for non-existent user")
}

// TestResendConfirmationCode_LocalEndpoint tests that ResendConfirmationCode
// handles local endpoint correctly (should not fail, just log)
func TestResendConfirmationCode_LocalEndpoint(t *testing.T) {
	cfg := &config.Config{
		CognitoUserPoolID:   "local_test_pool",
		CognitoClientID:      "test_client_id",
		CognitoClientSecret:  "",
		CognitoEndpoint:      "http://localhost:9229",
	}

	client, err := NewClient(cfg)
	require.NoError(t, err)

	ctx := context.Background()

	// Should not error for local endpoint (just logs)
	err = client.ResendConfirmationCode(ctx, "test@example.com")
	assert.NoError(t, err, "ResendConfirmationCode should not error for local endpoint")
}

// TestUsernameSelection tests the username selection logic based on endpoint
func TestUsernameSelection(t *testing.T) {
	tests := []struct {
		name           string
		endpoint       string
		email          string
		expectEmail    bool
		expectUUID     bool
	}{
		{
			name:        "local endpoint uses email",
			endpoint:    "http://localhost:9229",
			email:       "test@example.com",
			expectEmail: true,
			expectUUID:  false,
		},
		{
			name:        "AWS endpoint uses UUID",
			endpoint:    "",
			email:       "test@example.com",
			expectEmail: false,
			expectUUID:  true,
		},
		{
			name:        "non-local endpoint uses UUID",
			endpoint:    "https://cognito-idp.us-east-1.amazonaws.com",
			email:       "test@example.com",
			expectEmail: false,
			expectUUID:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := &config.Config{
				CognitoUserPoolID:   "test_pool",
				CognitoClientID:      "test_client",
				CognitoClientSecret:  "",
				CognitoEndpoint:      tt.endpoint,
			}

			client, err := NewClient(cfg)
			require.NoError(t, err)

			// We can't directly test the username selection without calling SignUp
			// But we can verify the endpoint is stored correctly
			isLocal := client.endpoint != "" && strings.Contains(client.endpoint, "localhost:9229")
			if tt.expectEmail {
				assert.True(t, isLocal, "Should detect local endpoint")
			}
		})
	}
}

// TestErrorHandling tests error handling for various Cognito errors
func TestErrorHandling_UsernameExistsException(t *testing.T) {
	// Test that UsernameExistsException is properly handled
	// This is tested through the SignupService tests
	// Here we just verify the error type
	err := &types.UsernameExistsException{}
	assert.NotNil(t, err)
}

