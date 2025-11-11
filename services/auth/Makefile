.PHONY: build deploy clean deps migrate-up migrate-down migrate-install

# Install dependencies
deps:
	go mod tidy

# Build for Linux ARM64 (Lambda)
build:
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -tags lambda.norpc -o bootstrap cmd/api/main.go

# Local build (for testing)
build-local:
	go build -o bin/api cmd/api/main.go

# Deploy
deploy:
	serverless deploy

# Deploy function only
deploy-function:
	serverless deploy function -f api

# Clean generated files
clean:
	rm -f bootstrap function.zip bin/api

# Install Serverless Framework (if needed)
install-serverless:
	npm install -g serverless

# Install migrate CLI tool
migrate-install:
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

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

