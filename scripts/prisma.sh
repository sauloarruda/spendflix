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

echo -e "\n${BLUE}${BOLD}🚀 Starting Prisma Generation${NC}\n"

# Generate Prisma client
print_step "Generating Prisma client..."
cd "$PROJECT_ROOT/database"
pnpm prisma generate

if [ $? -eq 0 ]; then
    print_success "Prisma client generated successfully"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Create or clean web generated directory
print_step "Preparing web generated directory..."
WEB_GENERATED_DIR="$PROJECT_ROOT/apps/web/generated"

if [ -d "$WEB_GENERATED_DIR" ]; then
    print_warning "Cleaning existing generated directory..."
    rm -rf "$WEB_GENERATED_DIR"
fi

# Copy generated files
print_step "Copying generated files to web app..."
mkdir -p "$WEB_GENERATED_DIR/prisma"
cp -r "$PROJECT_ROOT/database/generated/prisma/"* "$WEB_GENERATED_DIR/prisma/"

if [ $? -eq 0 ]; then
    print_success "Generated files copied successfully"
else
    print_error "Failed to copy generated files"
    exit 1
fi

echo -e "\n${GREEN}${BOLD}✨ Prisma setup completed successfully!${NC}\n" 