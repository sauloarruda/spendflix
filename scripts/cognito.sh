#!/bin/bash

# Get the absolute path of the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AUTH_SERVICE_DIR="$PROJECT_ROOT/services/auth"

# Colors and styles
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'
DIM='\033[2m'

# Function to print styled messages
print_step() {
    echo -e "\n${BLUE}${BOLD}➜${NC} ${BOLD}$1${NC}"
}

print_success() {
    echo -e "${GREEN}${BOLD}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}${BOLD}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}${BOLD}✗${NC} $1"
}

# Function to cleanup cognito-local process
cleanup() {
    if [ ! -z "$COGNITO_PID" ]; then
        print_step "Stopping cognito-local process..."
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
    print_success "Environment variables updated in $env_file"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Please install it first."
    exit 1
fi

# Check if aws cli is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is required but not installed. Please install it first."
    exit 1
fi

# Main script logic
if [ "$1" == "--setup" ]; then
    echo -e "\n${BLUE}${BOLD}🔐 Setting up Cognito${NC}\n"
    
    # Check if auth service directory exists
    if [ ! -d "$AUTH_SERVICE_DIR" ]; then
        print_error "Auth service directory not found at $AUTH_SERVICE_DIR"
        exit 1
    fi
    
    # Start cognito-local
    cd "$AUTH_SERVICE_DIR"
    
    # Check if cognito-local is installed
    if ! pnpm list cognito-local &> /dev/null; then
        print_error "cognito-local is not installed in the auth service"
        echo -e "Please run '${BOLD}pnpm add cognito-local${NC}' in the auth service directory first"
        exit 1
    fi
    
    print_step "Starting cognito-local..."
    pnpm cognito-local > /dev/null 2>&1 &
    COGNITO_PID=$!
    
    # Wait for cognito-local to start
    sleep 3
    
    # Create user pool
    print_step "Creating user pool..."
    POOL_RESPONSE=$(aws --endpoint http://localhost:9229 cognito-idp create-user-pool --pool-name SpendflixLocal)
    COGNITO_POOL_ID=$(extract_json_value "$POOL_RESPONSE" ".UserPool.Id")
    
    if [ -z "$COGNITO_POOL_ID" ]; then
        print_error "Failed to create user pool"
        exit 1
    fi
    
    # Create user pool client
    print_step "Creating user pool client..."
    CLIENT_RESPONSE=$(aws --endpoint http://localhost:9229 cognito-idp create-user-pool-client --user-pool-id "$COGNITO_POOL_ID" --client-name local)
    COGNITO_CLIENT_ID=$(extract_json_value "$CLIENT_RESPONSE" ".UserPoolClient.ClientId")
    
    if [ -z "$COGNITO_CLIENT_ID" ]; then
        print_error "Failed to create user pool client"
        exit 1
    fi
    
    # Write environment variables
    write_env_variables "$COGNITO_POOL_ID" "$COGNITO_CLIENT_ID"
    
    echo -e "\n${GREEN}${BOLD}✨ Cognito setup completed successfully!${NC}\n"
    echo -e "${DIM}Pool ID:${NC} ${BOLD}$COGNITO_POOL_ID${NC}"
    echo -e "${DIM}Client ID:${NC} ${BOLD}$COGNITO_CLIENT_ID${NC}"
else
    # Regular execution mode
    cd "$AUTH_SERVICE_DIR"
    print_step "Starting cognito-local..."
    CODE=123123 pnpm cognito-local
fi 