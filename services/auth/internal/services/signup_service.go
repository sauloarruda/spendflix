package services

import (
	"context"
	"errors"
	"fmt"
	"services/auth/internal/models"
	"services/auth/internal/repositories"
)

type SignupService struct {
	userRepo *repositories.UserRepository
}

func NewSignupService(userRepo *repositories.UserRepository) *SignupService {
	return &SignupService{
		userRepo: userRepo,
	}
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

	// Create new user
	user := &models.User{
		Name:  name,
		Email: email,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

