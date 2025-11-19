# Cursor Rules

This directory contains Cursor AI rules organized by service and general project rules.

## Structure

- `general.mdc` - General project rules (applies to all services)
- `auth.mdc` - Rules for the Go backend service (services/auth)
- `web.mdc` - Rules for the SvelteKit frontend service (services/web)

## Usage

Cursor will automatically read these rules when working in the respective service directories. The rules help guide code generation, refactoring, and best practices.

- `general.mdc` rules apply to the entire project
- Service-specific rules (`auth.mdc`, `web.mdc`) apply when working in their respective directories

## Adding New Rules

When adding new rules:
1. Add general rules to `general.mdc`
2. Add service-specific rules to the appropriate service file (`auth.mdc` or `web.mdc`)
3. Keep rules specific and actionable
4. Update this README if adding new service rules or general rules
