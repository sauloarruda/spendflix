const { FlatCompat } = require('@eslint/eslintrc');
const { createTypeScriptImportResolver } = require('eslint-import-resolver-typescript');
const path = require('path');

const compat = new FlatCompat({ baseDirectory: __dirname });
const prettierConfig = require('../../.prettierrc.json');

module.exports = [
  {
    ignores: [
      'eslint.config.js',
      'next.config.js',
      '**/types/api.d.ts',
      'node_modules/**',
      '.next/**',
      'generated/**',
    ],
  },

  ...compat.extends(
    'next/core-web-vitals',
    'plugin:prettier/recommended',
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
  ),

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      // Clean Code Principles - Function Rules
      'max-lines-per-function': [
        'error',
        {
          max: 100,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ], // Increased for React components
      'max-params': ['error', { max: 4 }], // For React components with context/props/etc
      complexity: ['error', { max: 15 }], // For more complex components
      'max-nested-callbacks': ['error', { max: 3 }], // For async operations
      'max-depth': ['error', { max: 3 }], // Keep max nesting depth at 3

      // Clean Code Principles - Naming
      camelcase: ['error', { properties: 'never' }], // Use meaningful names
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
          filter: {
            regex: '^I(Props|State|Context)$',
            match: false,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
      ],

      // Clean Code Principles - Code Organization
      'max-lines': [
        'error',
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ], // For larger components
      'no-duplicate-imports': 'error', // Avoid code duplication
      'import/order': [
        'warn',
        {
          // Organize imports
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],

      // Clean Code Principles - Error Handling
      'no-throw-literal': 'error', // Throw Error objects
      'no-return-await': 'error', // Don't return await

      // Clean Code Principles - Maintainability
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 20, 24, 60, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ], // Common numbers in web development
      'no-var': 'error', // Use const and let
      'prefer-const': ['error', { destructuring: 'all' }], // Use const when possible

      // Existing rules
      'prettier/prettier': [
        'warn',
        {
          ...prettierConfig,
          endOfLine: 'auto',
        },
      ],
      'no-console': 'warn',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'class-methods-use-this': 'off',
      'no-underscore-dangle': 'off',
      'import/no-relative-packages': 'off',
      'import/no-extraneous-dependencies': 'off',
      'no-use-before-define': 'off',
      'import/prefer-default-export': 'off', // Allow named exports
      'operator-linebreak': ['warn', 'after'], // Fix prettier conflicts
      'implicit-arrow-linebreak': 'off', // Fix prettier conflicts
      'function-paren-newline': 'off', // Fix prettier conflicts
      'object-curly-newline': 'off', // Fix prettier conflicts
      indent: 'off', // Let prettier handle indentation
    },
    settings: {
      'import/resolver': {
        typescript: {},
        node: {
          paths: ['src'],
          extensions: ['.js', '.ts', '.d.ts', '.tsx'],
        },
      },
    },
  },

  // Override rules for test files
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-lines-per-function': 'off', // Disable line limit for test files
      'max-lines': 'off', // Disable file line limit for test files
      'max-nested-callbacks': 'off', // Allow more nested callbacks in tests
      'max-depth': 'off', // Allow deeper nesting in tests
    },
  },
];
