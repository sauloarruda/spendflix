import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import prettierConfig from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
	// Base JavaScript config
	js.configs.recommended,

	// TypeScript files
	{
		files: ["**/*.ts", "**/*.js"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: "module",
				ecmaVersion: 2024,
				project: "./tsconfig.json",
			},
			globals: {
				// Browser globals
				window: "readonly",
				document: "readonly",
				navigator: "readonly",
				localStorage: "readonly",
				sessionStorage: "readonly",
				fetch: "readonly",
				Request: "readonly",
				Response: "readonly",
				Headers: "readonly",
				URL: "readonly",
				URLSearchParams: "readonly",
				FormData: "readonly",
				Blob: "readonly",
				File: "readonly",
				FileReader: "readonly",
				// Browser APIs
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				// DOM types
				HTMLElement: "readonly",
				HTMLButtonElement: "readonly",
				HTMLFormElement: "readonly",
				HTMLInputElement: "readonly",
				HTMLSelectElement: "readonly",
				HTMLTextAreaElement: "readonly",
				Event: "readonly",
				EventTarget: "readonly",
				SubmitEvent: "readonly",
				MouseEvent: "readonly",
				KeyboardEvent: "readonly",
				// Console (allowed in tests)
				console: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"no-console": ["warn", { allow: ["warn", "error"] }],
			"no-unused-vars": "off",
		},
	},

	// Test files - more lenient rules
	{
		files: ["**/*.spec.ts", "**/*.test.ts", "**/tests/**/*.ts"],
		rules: {
			"no-console": "off",
			"@typescript-eslint/no-explicit-any": "off",
		},
	},

	// Svelte files
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
			},
			globals: {
				// Browser globals
				window: "readonly",
				document: "readonly",
				localStorage: "readonly",
				sessionStorage: "readonly",
				fetch: "readonly",
				URL: "readonly",
				URLSearchParams: "readonly",
				// DOM types
				HTMLElement: "readonly",
				HTMLButtonElement: "readonly",
				HTMLFormElement: "readonly",
				HTMLInputElement: "readonly",
				Event: "readonly",
				SubmitEvent: "readonly",
				MouseEvent: "readonly",
				KeyboardEvent: "readonly",
				// Console (for development)
				console: "readonly",
			},
		},
		plugins: {
			svelte: sveltePlugin,
			"@typescript-eslint": tsPlugin,
		},
		rules: {
			...sveltePlugin.configs.recommended.rules,
			"svelte/no-at-html-tags": "warn",
			"svelte/valid-compile": "error",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},

	// Prettier config (must be last)
	prettierConfig,

	// Ignore patterns
	{
		ignores: [
			"build/",
			".svelte-kit/",
			"node_modules/",
			"src/lib/api/generated/",
			"*.config.js",
			"*.config.ts",
			"dist/",
			".env",
			".env.*",
		],
	},
];
