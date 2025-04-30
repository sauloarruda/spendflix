#!/bin/bash

# Get the absolute path of the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Function to copy .env.example to .env.local if it doesn't exist
copy_env_file() {
    local dir="$1"
    local example_file="$dir/.env.example"
    local target_file="$dir/.env.local"
    
    if [ -f "$example_file" ]; then
        if [ -f "$target_file" ]; then
            read -p "$(echo -e "${YELLOW}${BOLD}⚠${NC} ${BOLD}$target_file${NC} already exists. Do you want to overwrite it? (y/N) ")" -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_warning "Skipping $target_file"
                return
            fi
        fi
        print_step "Creating $target_file from $example_file"
        cp "$example_file" "$target_file"
        print_success "Created $target_file"
    else
        print_error "$example_file not found"
    fi
}

echo -e "\n${BLUE}${BOLD}🚀 Starting Spendflix Setup${NC}\n"

# Copy environment files
print_step "Setting up environment files..."
copy_env_file "$PROJECT_ROOT/apps/web"
copy_env_file "$PROJECT_ROOT/services/auth"

# Check for existing .cognito directory
COGNITO_DIR="$PROJECT_ROOT/services/auth/.cognito"
if [ -d "$COGNITO_DIR" ]; then
    read -p "$(echo -e "${YELLOW}${BOLD}⚠${NC} Cognito data directory (.cognito) already exists. Do you want to reset it? (y/N) ")" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Skipping Cognito setup"
        exit 0
    fi
fi

# Setup Cognito
print_step "Setting up Cognito..."
cd "$PROJECT_ROOT"
pnpm cognito:setup

echo -e "\n${GREEN}${BOLD}✨ Setup completed successfully!${NC}\n" 