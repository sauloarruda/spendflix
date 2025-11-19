.PHONY: build clean dev install-deps

# Install dependencies
install-deps:
	npm install

# Full build
build:
	@echo "Building SvelteKit app..."
	npm run build
	@echo "Build completed!"

# Development mode: start SvelteKit dev server
dev:
	npm run dev

# Clean generated files
clean:
	rm -rf build/
	rm -rf .svelte-kit/
	rm -rf node_modules/.vite/

