package services

import (
	"errors"

	"services/auth/internal/models"
)

var (
	// ErrUserAlreadyExists indicates that the user already exists and is confirmed.
	ErrUserAlreadyExists = errors.New("user with this email already exists")
	// ErrSignupProviderUnavailable indicates that the external identity provider is unavailable.
	ErrSignupProviderUnavailable = errors.New("signup provider unavailable")
)

// SignupResult contains the outcome of a signup operation.
type SignupResult = models.SignupOutcome
