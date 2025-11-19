# Cursor Rules for Web Service (SvelteKit)

## Overview
Frontend application built with SvelteKit, TailwindCSS, and Preline UI components.

## Code Style Guidelines

### TypeScript/Svelte Best Practices
- Use TypeScript strict mode
- Prefer Svelte 5 runes ($state, $derived, $effect)
- Use ESLint and Prettier for code quality
- Follow SvelteKit conventions
- Use type-safe API client (generated from OpenAPI)
- Prefer composition over inheritance
- Use TailwindCSS for styling

### Project Structure
```
services/web/
  src/
    routes/              # SvelteKit routes
    lib/
      components/ds/     # Design system components
      api/              # API client (generated + wrapper)
      i18n/             # Internationalization
      client/           # Client-side initialization
  static/               # Static assets
  tests/                # E2E tests (Playwright)
```

### Svelte 5 Runes
- Use `$state()` for reactive state
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `$props()` for component props
- Avoid `let` declarations for reactive state

### TypeScript
- Always use explicit types
- Avoid `any` type (use `unknown` if needed)
- Use type-safe API client
- Leverage TypeScript's type inference
- Use interfaces for component props

### Styling
- Use TailwindCSS utility classes
- Use Preline UI components when available
- Follow design system patterns
- Keep styles scoped to components
- Use CSS variables for theming

### API Integration
- Use generated API client from OpenAPI spec
- Handle errors gracefully with i18n
- Show loading states
- Validate inputs before submission
- Use proper error types (ApiError, NetworkError)

### Internationalization
- All user-facing text must be translatable
- Use `$_()` function for translations
- Keep translation keys organized
- Provide fallback messages
- Support pt-BR and en-US

### Testing
- Write E2E tests for critical user flows
- Use Playwright for browser testing
- Test error scenarios
- Test form validation
- Test API integration

### Performance
- Minimize bundle size (code splitting)
- Use lazy loading for routes
- Optimize images
- Use SvelteKit's built-in optimizations
- Avoid unnecessary re-renders

### Accessibility
- Use semantic HTML
- Add ARIA labels when needed
- Ensure keyboard navigation
- Test with screen readers
- Maintain proper focus management

### Form Handling
- Validate inputs on blur and submit
- Show clear error messages
- Disable submit button while processing
- Handle network errors gracefully
- Provide user feedback

### Git Workflow
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Reference Linear issues: `feat(SPE-8): description`
- Keep commits focused and atomic
- Write clear commit messages

### When Writing Code
- Think about user experience
- Consider loading states
- Handle error cases
- Write self-documenting code
- Keep components small and focused
- Extract reusable logic
- Use meaningful variable names
- Follow SvelteKit conventions

