package repositories

import (
	"context"
	"errors"
	"services/auth/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, name, email, temporary_password, cognito_id, created_at, updated_at
		FROM users
		WHERE email = $1
		LIMIT 1
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.TemporaryPassword,
		&user.CognitoID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (name, email, temporary_password, cognito_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		ctx,
		query,
		user.Name,
		user.Email,
		user.TemporaryPassword,
		user.CognitoID,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET name = $1, temporary_password = $2, cognito_id = $3, updated_at = NOW()
		WHERE id = $4
		RETURNING updated_at
	`

	return r.db.QueryRow(
		ctx,
		query,
		user.Name,
		user.TemporaryPassword,
		user.CognitoID,
		user.ID,
	).Scan(&user.UpdatedAt)
}
