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
	"services/auth/internal/testhelpers"

	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
)

// UserRepositoryInterface defines repository operations (aliased for convenience)
type UserRepositoryInterface = testhelpers.UserRepositoryInterface

// CognitoClientInterface defines Cognito client operations (aliased for convenience)
type CognitoClientInterface = testhelpers.CognitoClientInterface

type SignupService struct {
	userRepo         UserRepositoryInterface
	cognitoClient    CognitoClientInterface
	encryptFunc      func(string, string) (string, error)
	decryptFunc      func(string, string) (string, error)
	encryptionSecret string
}

// NewSignupService creates a new SignupService with concrete implementations
func NewSignupService(
	userRepo *repositories.UserRepository,
	cognitoClient *cognito.Client,
	encryptionSecret string,
) *SignupService {
	return NewSignupServiceWithInterfaces(userRepo, cognitoClient, encryptionSecret)
}

// NewSignupServiceWithInterfaces creates a new SignupService with interface-based dependencies
// This allows for easier testing with mocks
func NewSignupServiceWithInterfaces(
	userRepo UserRepositoryInterface,
	cognitoClient CognitoClientInterface,
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
	const (
		lowercase = "abcdefghijklmnopqrstuvwxyz"
		uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		numbers   = "0123456789"
		special   = "!@#$%^&*()-_+=<>?"
		allChars  = lowercase + uppercase + numbers + special
	)

	if length < 4 {
		length = 4 // Minimum length to satisfy all requirements
	}

	password := make([]byte, length)

	// Ensure at least one character from each required category
	// Select random character from each category
	categories := []string{
		lowercase,
		uppercase,
		numbers,
		special,
	}

	for _, category := range categories {
		randomByte := make([]byte, 1)
		if _, err := rand.Read(randomByte); err != nil {
			return "", fmt.Errorf("failed to generate random byte: %w", err)
		}
		char := category[int(randomByte[0])%len(category)]

		// Place at random position
		randomByte = make([]byte, 1)
		if _, err := rand.Read(randomByte); err != nil {
			return "", fmt.Errorf("failed to generate random byte: %w", err)
		}
		pos := int(randomByte[0]) % length
		// Make sure we don't overwrite a previously placed required char
		for password[pos] != 0 {
			pos = (pos + 1) % length
		}
		password[pos] = char
	}

	// Fill remaining positions with random characters from allChars
	for i := range password {
		if password[i] == 0 {
			randomByte := make([]byte, 1)
			if _, err := rand.Read(randomByte); err != nil {
				return "", fmt.Errorf("failed to generate random byte: %w", err)
			}
			password[i] = allChars[int(randomByte[0])%len(allChars)]
		}
	}

	// Shuffle the password to randomize positions
	// This ensures required chars aren't always at the beginning
	for i := len(password) - 1; i > 0; i-- {
		randomByte := make([]byte, 1)
		if _, err := rand.Read(randomByte); err != nil {
			return "", fmt.Errorf("failed to generate random byte: %w", err)
		}
		j := int(randomByte[0]) % (i + 1)
		password[i], password[j] = password[j], password[i]
	}

	return string(password), nil
}

func (s *SignupService) Signup(ctx context.Context, name, email string) (*models.User, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	// If user exists in DB with CognitoID, check if they're confirmed in Cognito
	if existingUser != nil && existingUser.CognitoID != nil {
		isConfirmed, username, _, checkErr := s.cognitoClient.IsUserConfirmed(ctx, email)
		if checkErr != nil {
			// If we can't check status, return generic error
			return nil, errors.New("user with this email already exists")
		}

		if !isConfirmed {
			// User exists but is not confirmed, resend confirmation code
			if resendErr := s.cognitoClient.ResendConfirmationCode(ctx, username); resendErr != nil {
				return nil, fmt.Errorf("failed to resend confirmation code: %w", resendErr)
			}
			// Return the existing user (transparent to the API consumer)
			return existingUser, nil
		}

		// User exists and is confirmed
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
			// User already exists in Cognito, check if they're confirmed
			isConfirmed, username, userSub, checkErr := s.cognitoClient.IsUserConfirmed(ctx, email)
			if checkErr != nil {
				// If we can't check status, return generic error
				return nil, errors.New("user with this email already exists")
			}

			if !isConfirmed {
				// User exists but is not confirmed, resend confirmation code
				if resendErr := s.cognitoClient.ResendConfirmationCode(ctx, username); resendErr != nil {
					return nil, fmt.Errorf("failed to resend confirmation code: %w", resendErr)
				}

				// Find or create user in DB
				if existingUser != nil {
					// Update existing user with Cognito ID if not already set
					if existingUser.CognitoID == nil {
						cognitoIDPtr := &userSub
						existingUser.CognitoID = cognitoIDPtr
						if err := s.userRepo.Update(ctx, existingUser); err != nil {
							return nil, fmt.Errorf("failed to update user: %w", err)
						}
					}
					return existingUser, nil
				}

				// User exists in Cognito but not in DB, create it
				cognitoIDPtr := &userSub
				user := &models.User{
					Name:      name,
					Email:     email,
					CognitoID: cognitoIDPtr,
				}
				if err := s.userRepo.Create(ctx, user); err != nil {
					return nil, fmt.Errorf("failed to create user: %w", err)
				}
				return user, nil
			}

			// User exists and is confirmed
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
