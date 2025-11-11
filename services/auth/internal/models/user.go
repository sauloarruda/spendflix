package models

import "time"

type User struct {
	ID                int       `db:"id"`
	Name              string    `db:"name"`
	Email             string    `db:"email"`
	TemporaryPassword *string   `db:"temporary_password"`
	CognitoID         *string   `db:"cognito_id"`
	CreatedAt         time.Time `db:"created_at"`
	UpdatedAt         time.Time `db:"updated_at"`
}

type SignupRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type SignupResponse struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

