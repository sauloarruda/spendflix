package testhelpers

import (
	"services/auth/internal/models"
	"time"
)

// UserFixture creates a test user with default values.
func UserFixture(overrides ...func(*models.User)) *models.User {
	user := &models.User{
		ID:        1,
		Name:      "Test User",
		Email:     "test@example.com",
		CognitoID: stringPtr("cognito-test-123"),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	for _, override := range overrides {
		override(user)
	}

	return user
}

// UserWithPassword creates a test user with temporary password.
func UserWithPassword(password string) *models.User {
	return UserFixture(func(u *models.User) {
		u.TemporaryPassword = &password
	})
}

// UserWithoutCognitoID creates a test user without Cognito ID.
func UserWithoutCognitoID() *models.User {
	return UserFixture(func(u *models.User) {
		u.CognitoID = nil
	})
}

// SignupRequestFixture creates a test signup request.
func SignupRequestFixture(overrides ...func(*models.SignupRequest)) models.SignupRequest {
	req := models.SignupRequest{
		Name:  "Test User",
		Email: "test@example.com",
	}

	for _, override := range overrides {
		override(&req)
	}

	return req
}

// Helper function to create string pointer.
func stringPtr(s string) *string {
	return &s
}
