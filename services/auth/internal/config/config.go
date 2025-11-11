package config

import (
	"os"
)

type Config struct {
	DatabaseURL      string
	EncryptionSecret string
	// Cognito
	CognitoUserPoolID   string
	CognitoClientID     string
	CognitoClientSecret string // Optional: required if client has secret
	CognitoEndpoint     string
}

func Load() (*Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		panic("Missing required environment variable: DATABASE_URL")
	}

	encryptionSecret := os.Getenv("ENCRYPTION_SECRET")
	if encryptionSecret == "" {
		panic("Missing required environment variable: ENCRYPTION_SECRET")
	}

	cognitoUserPoolID := os.Getenv("COGNITO_USER_POOL_ID")
	if cognitoUserPoolID == "" {
		panic("Missing required environment variable: COGNITO_USER_POOL_ID")
	}

	cognitoClientID := os.Getenv("COGNITO_CLIENT_ID")
	if cognitoClientID == "" {
		panic("Missing required environment variable: COGNITO_CLIENT_ID")
	}

	// Cognito client secret - optional, only needed if client has secret configured
	cognitoClientSecret := os.Getenv("COGNITO_CLIENT_SECRET")

	// Cognito endpoint - empty means use AWS default endpoint (for production/Lambda)
	// Set to http://localhost:9229 for local development with cognito-local
	cognitoEndpoint := os.Getenv("COGNITO_ENDPOINT")

	return &Config{
		DatabaseURL:         databaseURL,
		EncryptionSecret:    encryptionSecret,
		CognitoUserPoolID:   cognitoUserPoolID,
		CognitoClientID:     cognitoClientID,
		CognitoClientSecret: cognitoClientSecret,
		CognitoEndpoint:     cognitoEndpoint,
	}, nil
}
