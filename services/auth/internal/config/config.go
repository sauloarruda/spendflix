package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
}

func Load() (*Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		panic("Missing required environment variable: DATABASE_URL")
	}

	return &Config{
		DatabaseURL: databaseURL,
	}, nil
}

