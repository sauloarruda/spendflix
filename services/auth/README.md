# Spendflix Auth Service

Spendflix authentication service in Go, deployed on AWS Lambda.

## Project Structure

```
services/auth/
  cmd/
    api/
      main.go          # Application entry point
  internal/
    handlers/          # HTTP handlers
      signup.go
  migrations/          # Database migrations
    000001_create_users_table.up.sql
    000001_create_users_table.down.sql
  go.mod
  serverless.yml      # Serverless Framework configuration
  Makefile            # Useful commands
```

## Initial Setup

### Prerequisites

- Go 1.21 or higher
- Node.js and npm (for Serverless Framework)
- AWS CLI configured
- AWS credentials configured

### Installation

1. Install Go dependencies:

```bash
make deps
```

2. Install Serverless Framework (if not already installed):

```bash
make install-serverless
# or
npm install -g serverless
```

3. Install migrate CLI tool (for database migrations):

```bash
make migrate-install
```

## Database Migrations

### Running Migrations

Before running the application, you need to run database migrations to create the required tables.

1. Set the `DATABASE_URL` environment variable in your `.env` file:

```bash
# For local development, add ?sslmode=disable to disable SSL
DATABASE_URL=postgresql://user:password@localhost:5432/spendflix_development?sslmode=disable
```

Or export it directly:

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/spendflix_development?sslmode=disable
```

**Note:** The `?sslmode=disable` parameter is required for local PostgreSQL instances that don't have SSL enabled.

2. Run migrations:

```bash
make migrate-up
```

### Rolling Back Migrations

To rollback the last migration:

```bash
make migrate-down
```

## Build and Deploy

### Build for Lambda

```bash
make build
```

This creates the `bootstrap` binary compiled for Linux ARM64, which is the required format for AWS Lambda.

### Deploy

```bash
make deploy
```

Or deploy only the function:

```bash
make deploy-function
```

## Current Endpoint

### POST /auth/sign-up

Example endpoint that returns status 201 with a JSON containing `user` and `token`.

**Example response:**

```json
{
  "user": {
    "id": 1,
    "name": "Example User",
    "email": "example@spendflix.com"
  },
  "token": "example-token-12345"
}
```

## Next Steps

- [ ] Implement real sign-up logic
- [ ] PostgreSQL integration
- [ ] AWS Cognito integration
- [ ] Input validation
- [ ] Complete error handling
- [ ] Unit and integration tests
