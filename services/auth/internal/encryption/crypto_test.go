package encryption

import (
	"encoding/base64"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testMessagePlaintext = "test message"
)

func TestEncrypt_Decrypt_Roundtrip(t *testing.T) {
	tests := []struct {
		name      string
		plaintext string
		secret    string
	}{
		{
			name:      "simple text",
			plaintext: "hello world",
			secret:    "test-secret-key-1234567890123456",
		},
		{
			name:      "empty string",
			plaintext: "",
			secret:    "test-secret-key-1234567890123456",
		},
		{
			name:      "long text",
			plaintext: "This is a very long text that needs to be encrypted and decrypted properly. It contains multiple sentences and special characters! @#$%^&*()",
			secret:    "test-secret-key-1234567890123456",
		},
		{
			name:      "special characters",
			plaintext: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
			secret:    "test-secret-key-1234567890123456",
		},
		{
			name:      "unicode characters",
			plaintext: "Hello 世界 🌍",
			secret:    "test-secret-key-1234567890123456",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encrypted, err := Encrypt(tt.plaintext, tt.secret)
			require.NoError(t, err, "Encrypt should not return error")
			assert.NotEmpty(t, encrypted, "Encrypted text should not be empty")
			assert.NotEqual(t, tt.plaintext, encrypted, "Encrypted text should be different from plaintext")

			decrypted, err := Decrypt(encrypted, tt.secret)
			require.NoError(t, err, "Decrypt should not return error")
			assert.Equal(t, tt.plaintext, decrypted, "Decrypted text should match original plaintext")
		})
	}
}

func TestEncrypt_DifferentSecrets(t *testing.T) {
	plaintext := testMessagePlaintext
	secret1 := "secret-key-12345678901234567890"
	secret2 := "different-secret-key-123456789"

	encrypted1, err := Encrypt(plaintext, secret1)
	require.NoError(t, err)

	encrypted2, err := Encrypt(plaintext, secret2)
	require.NoError(t, err)

	// Encrypted texts should be different when using different secrets
	assert.NotEqual(t, encrypted1, encrypted2, "Encrypted texts with different secrets should be different")

	// Decrypting with wrong secret should fail
	_, err = Decrypt(encrypted1, secret2)
	assert.Error(t, err, "Decrypting with wrong secret should return error")
}

func TestEncrypt_Deterministic(t *testing.T) {
	plaintext := testMessagePlaintext
	secret := "test-secret-key-1234567890123456"

	// Encrypting the same text multiple times should produce different results (due to random IV)
	encrypted1, err := Encrypt(plaintext, secret)
	require.NoError(t, err)

	encrypted2, err := Encrypt(plaintext, secret)
	require.NoError(t, err)

	// Encrypted texts should be different (due to random IV)
	assert.NotEqual(t, encrypted1, encrypted2, "Encrypted texts should be different due to random IV")

	// But both should decrypt to the same plaintext
	decrypted1, err := Decrypt(encrypted1, secret)
	require.NoError(t, err)

	decrypted2, err := Decrypt(encrypted2, secret)
	require.NoError(t, err)

	assert.Equal(t, plaintext, decrypted1)
	assert.Equal(t, plaintext, decrypted2)
}

func TestEncrypt_IncludesSaltAndIv(t *testing.T) {
	plaintext := testMessagePlaintext
	secret := "test-secret-key-1234567890123456"

	encrypted, err := Encrypt(plaintext, secret)
	require.NoError(t, err)

	data, err := base64.StdEncoding.DecodeString(encrypted)
	require.NoError(t, err)

	require.GreaterOrEqual(t, len(data), saltLength+ivLength+tagLength, "encoded payload should contain salt, IV, tag, and ciphertext")

	salt := data[:saltLength]
	iv := data[saltLength : saltLength+ivLength]

	assert.NotEqual(t, make([]byte, saltLength), salt, "salt should contain random bytes")
	assert.NotEqual(t, make([]byte, ivLength), iv, "IV should contain random bytes")
}

func TestDecrypt_InvalidInput(t *testing.T) {
	tests := []struct {
		name          string
		encryptedText string
		secret        string
		expectError   bool
	}{
		{
			name:          "empty encrypted text",
			encryptedText: "",
			secret:        "test-secret-key-1234567890123456",
			expectError:   true,
		},
		{
			name:          "invalid base64",
			encryptedText: "not-valid-base64!!!",
			secret:        "test-secret-key-1234567890123456",
			expectError:   true,
		},
		{
			name:          "too short encrypted text",
			encryptedText: "dGVzdA==", // "test" in base64, but too short for IV+tag
			secret:        "test-secret-key-1234567890123456",
			expectError:   true,
		},
		{
			name: "wrong secret",
			encryptedText: func() string {
				enc, _ := Encrypt("test", "correct-secret")
				return enc
			}(),
			secret:      "wrong-secret",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Decrypt(tt.encryptedText, tt.secret)
			if tt.expectError {
				assert.Error(t, err, "Decrypt should return error for invalid input")
			} else {
				assert.NoError(t, err, "Decrypt should not return error")
			}
		})
	}
}

func TestEncrypt_Decrypt_WithEmptySecret(t *testing.T) {
	plaintext := testMessagePlaintext
	secret := ""

	encrypted, err := Encrypt(plaintext, secret)
	require.NoError(t, err, "Encrypt should work even with empty secret")

	decrypted, err := Decrypt(encrypted, secret)
	require.NoError(t, err, "Decrypt should work with empty secret")
	assert.Equal(t, plaintext, decrypted)
}
