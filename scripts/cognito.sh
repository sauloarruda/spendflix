#!/bin/bash

# Get the absolute path of the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AUTH_SERVICE_DIR="$PROJECT_ROOT/services/auth"

# Function to cleanup cognito-local process
cleanup() {
    if [ ! -z "$COGNITO_PID" ]; then
        echo "Stopping cognito-local process..."
        kill $COGNITO_PID 2>/dev/null || true
    fi
}

# Set up trap to ensure cleanup runs on script exit
trap cleanup EXIT

# Function to extract JSON value using jq
extract_json_value() {
    local json="$1"
    local path="$2"
    echo "$json" | jq -r "$path"
}

# Function to write environment variables to .env.local
write_env_variables() {
    local pool_id="$1"
    local client_id="$2"
    local env_file="$AUTH_SERVICE_DIR/.env.local"
    local temp_file="$env_file.tmp"
    
    # Create temp file with new values
    echo "COGNITO_USER_POOL_ID=$pool_id" > "$temp_file"
    echo "COGNITO_CLIENT_ID=$client_id" >> "$temp_file"
    
    # If .env.local exists, preserve other variables
    if [ -f "$env_file" ]; then
        # Read existing file and preserve other variables
        while IFS= read -r line; do
            if [[ ! "$line" =~ ^(COGNITO_USER_POOL_ID|COGNITO_CLIENT_ID)= ]]; then
                echo "$line" >> "$temp_file"
            fi
        done < "$env_file"
    fi
    
    # Replace the original file with the temp file
    mv "$temp_file" "$env_file"
    echo "Environment variables updated in $env_file"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install it first."
    exit 1
fi

# Check if aws cli is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is required but not installed. Please install it first."
    exit 1
fi

# Main script logic
if [ "$1" == "--setup" ]; then
    echo "Running Cognito setup..."
    
    # Check if auth service directory exists
    if [ ! -d "$AUTH_SERVICE_DIR" ]; then
        echo "Error: Auth service directory not found at $AUTH_SERVICE_DIR"
        exit 1
    fi
    
    # Start cognito-local
    cd "$AUTH_SERVICE_DIR"
    
    # Check if cognito-local is installed
    if ! pnpm list cognito-local &> /dev/null; then
        echo "Error: cognito-local is not installed in the auth service"
        echo "Please run 'pnpm add cognito-local' in the auth service directory first"
        exit 1
    fi
    
    pnpm cognito-local > /dev/null 2>&1 &
    COGNITO_PID=$!
    
    # Wait for cognito-local to start
    sleep 3
    
    # Create user pool
    echo "Creating user pool..."
    POOL_RESPONSE=$(aws --endpoint http://localhost:9229 cognito-idp create-user-pool --pool-name SpendflixLocal)
    COGNITO_POOL_ID=$(extract_json_value "$POOL_RESPONSE" ".UserPool.Id")
    
    if [ -z "$COGNITO_POOL_ID" ]; then
        echo "Error: Failed to create user pool"
        exit 1
    fi
    
    # Create user pool client
    echo "Creating user pool client..."
    CLIENT_RESPONSE=$(aws --endpoint http://localhost:9229 cognito-idp create-user-pool-client --user-pool-id "$COGNITO_POOL_ID" --client-name local)
    COGNITO_CLIENT_ID=$(extract_json_value "$CLIENT_RESPONSE" ".UserPoolClient.ClientId")
    
    if [ -z "$COGNITO_CLIENT_ID" ]; then
        echo "Error: Failed to create user pool client"
        exit 1
    fi
    
    # Write environment variables
    write_env_variables "$COGNITO_POOL_ID" "$COGNITO_CLIENT_ID"
    
    echo "Cognito setup completed successfully"
    echo "Pool ID: $COGNITO_POOL_ID"
    echo "Client ID: $COGNITO_CLIENT_ID"
else
    # Regular execution mode
    cd "$AUTH_SERVICE_DIR"
    CODE=123123 pnpm cognito-local
fi 