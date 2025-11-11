package config

import (
	"os"
)

type Config struct {
	DatabaseURL     string
	EncryptionSecret string
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

	return &Config{
		DatabaseURL:      databaseURL,
		EncryptionSecret: encryptionSecret,
	}, nil
}

