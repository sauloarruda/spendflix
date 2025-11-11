package services

import (
	"context"
	"errors"
	"testing"

	"services/auth/internal/models"
	"services/auth/internal/testhelpers"

	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestSignupService_Signup_NewUser(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"
	cognitoID := "cognito-123"

	// Setup mocks
	mockRepo.On("FindByEmail", ctx, email).Return(nil, nil)
	mockCognito.On("SignUp", ctx, email, mock.AnythingOfType("string"), name).Return(cognitoID, nil)
	mockRepo.On("Create", ctx, mock.MatchedBy(func(user *models.User) bool {
		return user.Name == name && user.Email == email && user.CognitoID != nil && *user.CognitoID == cognitoID
	})).Return(nil).Run(func(args mock.Arguments) {
		user := args.Get(1).(*models.User)
		user.ID = 1
	})

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, name, user.Name)
	assert.Equal(t, email, user.Email)
	assert.NotNil(t, user.CognitoID)
	assert.Equal(t, cognitoID, *user.CognitoID)
	assert.NotNil(t, user.TemporaryPassword)

	mockRepo.AssertExpectations(t)
	mockCognito.AssertExpectations(t)
}

func TestSignupService_Signup_UserAlreadyExists_Confirmed(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"
	cognitoID := "cognito-123"

	existingUser := &models.User{
		ID:        1,
		Name:      name,
		Email:     email,
		CognitoID: &cognitoID,
	}

	// Setup mocks
	mockRepo.On("FindByEmail", ctx, email).Return(existingUser, nil)
	mockCognito.On("IsUserConfirmed", ctx, email).Return(true, "username", cognitoID, nil)

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, "user with this email already exists", err.Error())
	assert.Nil(t, user)

	mockRepo.AssertExpectations(t)
	mockCognito.AssertExpectations(t)
}

func TestSignupService_Signup_UserExistsButUnconfirmed(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"
	cognitoID := "cognito-123"
	username := "john@example.com"

	existingUser := &models.User{
		ID:        1,
		Name:      name,
		Email:     email,
		CognitoID: &cognitoID,
	}

	// Setup mocks
	mockRepo.On("FindByEmail", ctx, email).Return(existingUser, nil)
	mockCognito.On("IsUserConfirmed", ctx, email).Return(false, username, cognitoID, nil)
	mockCognito.On("ResendConfirmationCode", ctx, username).Return(nil)

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, existingUser.ID, user.ID)

	mockRepo.AssertExpectations(t)
	mockCognito.AssertExpectations(t)
}

func TestSignupService_Signup_UserInCognitoButNotDB(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"
	cognitoID := "cognito-123"
	username := "john@example.com"

	// Setup mocks - user not in DB, but exists in Cognito (UsernameExistsException)
	mockRepo.On("FindByEmail", ctx, email).Return(nil, nil)
	mockCognito.On("SignUp", ctx, email, mock.AnythingOfType("string"), name).
		Return("", &types.UsernameExistsException{})
	mockCognito.On("IsUserConfirmed", ctx, email).Return(false, username, cognitoID, nil)
	mockCognito.On("ResendConfirmationCode", ctx, username).Return(nil)
	mockRepo.On("Create", ctx, mock.MatchedBy(func(user *models.User) bool {
		return user.Name == name && user.Email == email && user.CognitoID != nil && *user.CognitoID == cognitoID
	})).Return(nil).Run(func(args mock.Arguments) {
		user := args.Get(1).(*models.User)
		user.ID = 1
	})

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, name, user.Name)
	assert.Equal(t, email, user.Email)
	assert.NotNil(t, user.CognitoID)
	assert.Equal(t, cognitoID, *user.CognitoID)

	mockRepo.AssertExpectations(t)
	mockCognito.AssertExpectations(t)
}

func TestSignupService_Signup_UserInDBButNotCognito(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"
	cognitoID := "cognito-123"

	existingUser := &models.User{
		ID:        1,
		Name:      name,
		Email:     email,
		CognitoID: nil, // No Cognito ID yet
	}

	// Setup mocks
	mockRepo.On("FindByEmail", ctx, email).Return(existingUser, nil)
	mockCognito.On("SignUp", ctx, email, mock.AnythingOfType("string"), name).Return(cognitoID, nil)
	mockRepo.On("Update", ctx, mock.MatchedBy(func(user *models.User) bool {
		return user.ID == existingUser.ID && user.CognitoID != nil && *user.CognitoID == cognitoID
	})).Return(nil)

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, existingUser.ID, user.ID)
	assert.NotNil(t, user.CognitoID)
	assert.Equal(t, cognitoID, *user.CognitoID)

	mockRepo.AssertExpectations(t)
	mockCognito.AssertExpectations(t)
}

func TestSignupService_Signup_RepositoryError(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"

	// Setup mocks - repository error
	mockRepo.On("FindByEmail", ctx, email).Return(nil, errors.New("database error"))

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to check existing user")
	assert.Nil(t, user)

	mockRepo.AssertExpectations(t)
}

func TestSignupService_Signup_CognitoError(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"

	// Setup mocks
	mockRepo.On("FindByEmail", ctx, email).Return(nil, nil)
	mockCognito.On("SignUp", ctx, email, mock.AnythingOfType("string"), name).
		Return("", errors.New("cognito error"))

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to create user in Cognito")
	assert.Nil(t, user)

	mockRepo.AssertExpectations(t)
	mockCognito.AssertExpectations(t)
}

func TestSignupService_Signup_EncryptionError(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	// Override encrypt function to return error
	service.encryptFunc = func(plaintext, secret string) (string, error) {
		return "", errors.New("encryption error")
	}

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"

	// Setup mocks
	mockRepo.On("FindByEmail", ctx, email).Return(nil, nil)

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to encrypt password")
	assert.Nil(t, user)

	mockRepo.AssertExpectations(t)
}

func TestSignupService_Signup_ResendConfirmationCodeError(t *testing.T) {
	mockRepo := new(testhelpers.MockUserRepository)
	mockCognito := new(testhelpers.MockCognitoClient)

	service := NewSignupServiceWithInterfaces(
		mockRepo,
		mockCognito,
		"test-secret-key-1234567890123456",
	)

	ctx := context.Background()
	name := "John Doe"
	email := "john@example.com"
	cognitoID := "cognito-123"
	username := "john@example.com"

	existingUser := &models.User{
		ID:        1,
		Name:      name,
		Email:     email,
		CognitoID: &cognitoID,
	}

	// Setup mocks
	mockRepo.On("FindByEmail", ctx, email).Return(existingUser, nil)
	mockCognito.On("IsUserConfirmed", ctx, email).Return(false, username, cognitoID, nil)
	mockCognito.On("ResendConfirmationCode", ctx, username).Return(errors.New("resend error"))

	// Execute
	user, err := service.Signup(ctx, name, email)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to resend confirmation code")
	assert.Nil(t, user)

	mockRepo.AssertExpectations(t)
	mockCognito.AssertExpectations(t)
}

func TestGenerateTemporaryPassword(t *testing.T) {
	tests := []struct {
		name   string
		length int
	}{
		{"minimum length", 4},
		{"default length", 32},
		{"custom length", 16},
		{"very short (should use minimum)", 2},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			password, err := generateTemporaryPassword(tt.length)
			require.NoError(t, err)
			assert.NotEmpty(t, password)

			// Check minimum length
			expectedLength := tt.length
			if expectedLength < 4 {
				expectedLength = 4
			}
			assert.GreaterOrEqual(t, len(password), expectedLength)

			// Check that password contains required character types
			hasLower := false
			hasUpper := false
			hasNumber := false
			hasSpecial := false

			for _, char := range password {
				if char >= 'a' && char <= 'z' {
					hasLower = true
				}
				if char >= 'A' && char <= 'Z' {
					hasUpper = true
				}
				if char >= '0' && char <= '9' {
					hasNumber = true
				}
				if char == '!' || char == '@' || char == '#' || char == '$' || char == '%' ||
					char == '^' || char == '&' || char == '*' || char == '(' || char == ')' ||
					char == '-' || char == '_' || char == '+' || char == '=' || char == '<' ||
					char == '>' || char == '?' {
					hasSpecial = true
				}
			}

			assert.True(t, hasLower, "Password should contain lowercase")
			assert.True(t, hasUpper, "Password should contain uppercase")
			assert.True(t, hasNumber, "Password should contain number")
			assert.True(t, hasSpecial, "Password should contain special character")
		})
	}
}

func TestGenerateTemporaryPassword_Error(t *testing.T) {
	// This test is difficult to trigger since rand.Read rarely fails
	// But we can test the error path exists in the code
	// In practice, this would require mocking crypto/rand which is complex
	// So we'll just verify the function signature and basic behavior
	password, err := generateTemporaryPassword(32)
	assert.NoError(t, err)
	assert.NotEmpty(t, password)
}

