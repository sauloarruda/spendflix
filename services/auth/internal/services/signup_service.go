package services

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"services/auth/internal/cognito"
	"services/auth/internal/encryption"
	"services/auth/internal/models"
	"services/auth/internal/repositories"

	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
)

type SignupService struct {
	userRepo         *repositories.UserRepository
	cognitoClient    *cognito.Client
	encryptFunc      func(string, string) (string, error)
	decryptFunc      func(string, string) (string, error)
	encryptionSecret string
}

func NewSignupService(
	userRepo *repositories.UserRepository,
	cognitoClient *cognito.Client,
	encryptionSecret string,
) *SignupService {
	return &SignupService{
		userRepo:         userRepo,
		cognitoClient:    cognitoClient,
		encryptFunc:      encryption.Encrypt,
		decryptFunc:      encryption.Decrypt,
		encryptionSecret: encryptionSecret,
	}
}

func generateTemporaryPassword(length int) (string, error) {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_+=<>?"

	password := make([]byte, length)
	for i := range password {
		randomByte := make([]byte, 1)
		if _, err := rand.Read(randomByte); err != nil {
			return "", fmt.Errorf("failed to generate random byte: %w", err)
		}
		password[i] = charset[int(randomByte[0])%len(charset)]
	}

	return string(password), nil
}

func (s *SignupService) Signup(ctx context.Context, name, email string) (*models.User, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	if existingUser != nil && existingUser.CognitoID != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Generate temporary password
	temporaryPassword, err := generateTemporaryPassword(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate temporary password: %w", err)
	}

	// Encrypt password
	encryptedPassword, err := s.encryptFunc(temporaryPassword, s.encryptionSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt password: %w", err)
	}

	// Create user in Cognito first
	cognitoID, err := s.cognitoClient.SignUp(ctx, email, temporaryPassword, name)
	if err != nil {
		// Check if it's a username exists error
		var usernameExistsErr *types.UsernameExistsException
		if errors.As(err, &usernameExistsErr) {
			return nil, errors.New("user with this email already exists")
		}
		return nil, fmt.Errorf("failed to create user in Cognito: %w", err)
	}

	// Create new user with encrypted password and Cognito ID
	cognitoIDPtr := &cognitoID
	user := &models.User{
		Name:              name,
		Email:             email,
		TemporaryPassword: &encryptedPassword,
		CognitoID:         cognitoIDPtr,
	}

	if existingUser != nil {
		// Update existing user with Cognito ID
		user.ID = existingUser.ID
		if err := s.userRepo.Update(ctx, user); err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}
	} else {
		// Create new user
		if err := s.userRepo.Create(ctx, user); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}
	}

	return user, nil
}
