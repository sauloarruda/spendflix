package services

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"services/auth/internal/encryption"
	"services/auth/internal/models"
	"services/auth/internal/repositories"
	"time"
)

type SignupService struct {
	userRepo       *repositories.UserRepository
	encryptFunc    func(string, string) (string, error)
	decryptFunc    func(string, string) (string, error)
	encryptionSecret string
}

func NewSignupService(userRepo *repositories.UserRepository, encryptionSecret string) *SignupService {
	return &SignupService{
		userRepo:        userRepo,
		encryptFunc:     encryption.Encrypt,
		decryptFunc:     encryption.Decrypt,
		encryptionSecret: encryptionSecret,
	}
}

func generateTemporaryPassword(length int) string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_+=<>?"

	// Seed random number generator
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	password := make([]byte, length)
	for i := range password {
		password[i] = charset[rng.Intn(len(charset))]
	}

	return string(password)
}

func (s *SignupService) Signup(ctx context.Context, name, email string) (*models.User, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	if existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Generate temporary password
	temporaryPassword := generateTemporaryPassword(32)

	// Encrypt password
	encryptedPassword, err := s.encryptFunc(temporaryPassword, s.encryptionSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt password: %w", err)
	}

	// Create new user with encrypted password
	user := &models.User{
		Name:              name,
		Email:             email,
		TemporaryPassword: &encryptedPassword,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

