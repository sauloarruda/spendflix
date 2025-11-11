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

