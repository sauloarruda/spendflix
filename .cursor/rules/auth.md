# Cursor Rules for Auth Service (Go)

## Overview
Go backend service deployed on AWS Lambda for authentication and user management.

## Code Style Guidelines

### Go Best Practices
- Follow Go best practices and idioms
- Use interfaces for dependency injection
- Write tests for all business logic
- Use `golangci-lint` for linting
- Format code with `goimports` and `gofmt`
- Add comments to exported functions/types
- Use context.Context for cancellation and timeouts
- Handle errors explicitly (no silent failures)

### Project Structure
```
services/auth/
  cmd/api/           # Application entry point
  internal/
    handlers/        # HTTP handlers
    services/        # Business logic
    repositories/    # Database access
    cognito/         # Cognito client
    config/          # Configuration
    models/          # Data models
    testhelpers/     # Test utilities
  migrations/        # Database migrations
```

### Testing
- Write unit tests for business logic
- Write integration tests for API endpoints
- Use testcontainers for database tests
- Mock external dependencies (Cognito, etc.)
- Run tests before committing: `make test`

### Error Handling
- Return meaningful error messages
- Log errors with context
- Use structured logging
- Handle errors at appropriate levels
- Never ignore errors

### Database
- Use parameterized queries (prevent SQL injection)
- Handle connection pooling properly
- Use transactions when needed
- Close database connections properly
- Run migrations before deployment

### Security
- Never commit secrets or credentials
- Use environment variables for configuration
- Encrypt sensitive data at rest
- Validate and sanitize all inputs
- Use AWS Cognito for authentication

### Performance
- Optimize database queries (use indexes, avoid N+1)
- Use connection pooling
- Cache when appropriate
- Minimize Lambda cold starts

### AWS Lambda
- Keep handlers stateless
- Use environment variables for config
- Handle context cancellation
- Optimize cold start time
- Use appropriate memory/timeout settings

### Dependencies
- Keep dependencies up to date
- Review security advisories regularly
- Remove unused dependencies
- Pin versions for production

### Git Workflow
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Reference Linear issues: `feat(SPE-8): description`
- Keep commits focused and atomic
- Write clear commit messages

### When Writing Code
- Think about maintainability
- Consider edge cases
- Write self-documenting code
- Refactor when needed
- Keep functions small and focused
- Avoid premature optimization
- Use meaningful variable names
- Follow single responsibility principle
