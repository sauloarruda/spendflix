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

## Running Locally

To run the service locally for testing:

1. Make sure you have the `.env` file configured with `DATABASE_URL`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/spendflix_development?sslmode=disable
```

2. Run migrations (if not already done):

```bash
make migrate-up
```

3. Start the local server:

```bash
make dev
```

The server will start on port 3000 (or the port specified in the `PORT` environment variable).

4. Test the endpoint:

```bash
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

## Build and Deploy

### Build for Lambda

```bash
make build
```

This creates the `bootstrap` binary compiled for Linux ARM64, which is the required format for AWS Lambda.

### Deploy

Before deploying, create an environment-specific `.env` file. The file name should match your Serverless stage (default is `dev`):

```bash
# For development (default stage)
cp .env.dev.example .env.dev

# Generate a secure encryption secret
make generate-secret

# Edit .env.dev with your values
# DATABASE_URL=postgresql://user:password@host:5432/spendflix_development?sslmode=require
# ENCRYPTION_SECRET=<paste the generated secret here>
```

Then deploy:

```bash
# Deploy to default stage (dev)
make deploy

# Or deploy to a specific stage
SERVERLESS_STAGE=prod make deploy
```

The Makefile will automatically load variables from `.env.${stage}` during deployment.

**Note:** All `.env.*` files are in `.gitignore` and will not be committed to git.

Or deploy only the function:

```bash
make deploy-function
# Or with specific stage
SERVERLESS_STAGE=prod make deploy-function
```

## Current Endpoint

### POST /auth/sign-up

Creates a new user with the provided name and email.

**Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Success Response (201):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Error Responses:**

- `400` - Invalid request body or missing required fields
- `409` - User with this email already exists
- `500` - Internal server error

## Next Steps

- [ ] Implement real sign-up logic
- [ ] PostgreSQL integration
- [ ] AWS Cognito integration
- [ ] Input validation
- [ ] Complete error handling
- [ ] Unit and integration tests
