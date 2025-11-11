.PHONY: build deploy clean deps migrate-up migrate-down migrate-install dev generate-secret cognito-local-up cognito-local-down cognito-local-setup cognito-setup

# Install dependencies
deps:
	go mod tidy

# Build for Linux ARM64 (Lambda)
build:
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -tags lambda.norpc -o bootstrap cmd/api/main.go

# Local build (for testing)
build-local:
	go build -o bin/api cmd/api/main.go

# Run locally (development)
dev: build-local
	@if [ -f .env ]; then \
		export $$(grep -v '^#' .env | xargs); \
	fi; \
	./bin/api

# Deploy
deploy:
	@STAGE=$${SERVERLESS_STAGE:-dev}; \
	if [ -f .env.$$STAGE ]; then \
		echo "Loading environment variables from .env.$$STAGE"; \
		export $$(grep -v '^#' .env.$$STAGE | xargs); \
	fi; \
	if [ -z "$$DATABASE_URL" ]; then \
		echo "Error: DATABASE_URL not set. Create .env.$$STAGE file or export it."; \
		echo "Example: cp .env.dev.example .env.dev"; \
		exit 1; \
	fi; \
	serverless deploy --stage $$STAGE

# Deploy function only
deploy-function:
	@STAGE=$${SERVERLESS_STAGE:-dev}; \
	if [ -f .env.$$STAGE ]; then \
		echo "Loading environment variables from .env.$$STAGE"; \
		export $$(grep -v '^#' .env.$$STAGE | xargs); \
	fi; \
	serverless deploy function -f api --stage $$STAGE

# Clean generated files
clean:
	rm -f bootstrap function.zip bin/api

# Install Serverless Framework (if needed)
install-serverless:
	npm install -g serverless

# Install migrate CLI tool
migrate-install:
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Generate a secure encryption secret
generate-secret:
	@echo "Generating secure ENCRYPTION_SECRET..."
	@if command -v openssl > /dev/null; then \
		SECRET=$$(openssl rand -hex 32); \
		echo ""; \
		echo "ENCRYPTION_SECRET=$$SECRET"; \
		echo ""; \
		echo "Add this to your .env.dev file:"; \
		echo "ENCRYPTION_SECRET=$$SECRET"; \
	else \
		echo "openssl not found. Using alternative method..."; \
		SECRET=$$(head -c 32 /dev/urandom | xxd -p -c 32 | tr -d '\n'); \
		echo ""; \
		echo "ENCRYPTION_SECRET=$$SECRET"; \
		echo ""; \
		echo "Add this to your .env.dev file:"; \
		echo "ENCRYPTION_SECRET=$$SECRET"; \
	fi

# Run migrations up
migrate-up:
	@if [ -f .env ]; then \
		export $$(grep -v '^#' .env | xargs); \
	fi; \
	if [ -z "$$DATABASE_URL" ]; then \
		echo "Error: DATABASE_URL environment variable is not set"; \
		echo "Please set it in .env file or export it"; \
		exit 1; \
	fi; \
	migrate -path ./migrations -database "$$DATABASE_URL" up

# Rollback last migration
migrate-down:
	@if [ -f .env ]; then \
		export $$(grep -v '^#' .env | xargs); \
	fi; \
	if [ -z "$$DATABASE_URL" ]; then \
		echo "Error: DATABASE_URL environment variable is not set"; \
		echo "Please set it in .env file or export it"; \
		exit 1; \
	fi; \
	migrate -path ./migrations -database "$$DATABASE_URL" down 1

# Start cognito-local
cognito-local-up:
	@if ! command -v npx > /dev/null; then \
		echo "Error: npx not found. Please install Node.js."; \
		exit 1; \
	fi
	@echo "Starting cognito-local..."
	@npx cognito-local > /dev/null 2>&1 &
	@echo "Waiting for cognito-local to be ready..."
	@sleep 3
	@echo "cognito-local is ready on http://localhost:9229"

# Stop cognito-local
cognito-local-down:
	@pkill -f "cognito-local" || true
	@echo "cognito-local stopped"

# Setup Cognito User Pool and Client in cognito-local
cognito-local-setup:
	@if ! curl -s http://localhost:9229 > /dev/null 2>&1; then \
		echo "Error: cognito-local is not running. Run 'make cognito-local-up' first."; \
		exit 1; \
	fi
	@bash scripts/setup-cognito.sh

# Alias for cognito-local-setup
cognito-setup: cognito-local-setup

