# Cursor Rules

This directory contains Cursor AI rules organized by service.

## Structure

- `auth.md` - Rules for the Go backend service (services/auth)
- `web.md` - Rules for the SvelteKit frontend service (services/web)

## Usage

Cursor will automatically read these rules when working in the respective service directories. The rules help guide code generation, refactoring, and best practices.

## Adding New Rules

When adding new rules:
1. Add them to the appropriate service file
2. Keep rules specific and actionable
3. Update this README if adding new service rules

