.PHONY: build deploy clean deps

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

