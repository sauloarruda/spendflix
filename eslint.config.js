const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({ baseDirectory: __dirname });
const prettierConfig = require('./.prettierrc.json');

module.exports = [
  {
    ignores: [
      'eslint.config.js',
      'jest.config.ts',
      'serverless.ts',
      '**/types/api.d.ts',
      'node_modules/**',
      '.serverless/**',
      'generated/**',
      'dist/**',
      'src/__generated__/**',
    ],
  },

  ...compat.extends(
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ),

  {
    files: ['**/*.ts'],
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
      'max-lines-per-function': ['error', { max: 20 }], // Functions should be small
      'max-params': ['error', { max: 3 }], // Functions should have few parameters
      complexity: ['error', { max: 10 }], // Functions should not be complex
      'max-nested-callbacks': ['error', { max: 2 }], // Avoid deep nesting
      'max-depth': ['error', { max: 3 }], // Avoid deep nesting

      // Clean Code Principles - Naming
      camelcase: ['error', { properties: 'never' }], // Use meaningful names
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
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
      'max-lines': ['error', { max: 300 }], // Files should be small
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
      'no-magic-numbers': ['error', { ignore: [-1, 0, 1, 2] }], // Avoid magic numbers
      'no-var': 'error', // Use const and let
      'prefer-const': 'error', // Use const when possible

      // Existing rules
      'prettier/prettier': ['warn', prettierConfig],
      'no-console': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'class-methods-use-this': 'off',
      'no-underscore-dangle': 'off',
      'import/no-relative-packages': 'off',
      'import/no-extraneous-dependencies': 'off',
      'no-use-before-define': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: {},
        node: {
          paths: ['lib', 'generated/prisma', 'src'],
          extensions: ['.js', '.ts', '.d.ts', '.tsx'],
          alias: {
            '@/prisma': 'database/generated/prisma',
            '@/fabbrica': 'database/src/__generated__/fabbrica',
          },
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
