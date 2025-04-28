// eslint.config.js
const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({ baseDirectory: __dirname });
const prettierConfig = require('./.prettierrc.json');

module.exports = [
  {
    ignores: [
      'eslint.config.js',
      'Dangerfile.ts',
      '**/types/api.d.ts',
      'node_modules/**',
      'services/**/serverless.ts',
      'services/**/node_modules/**',
      'services/**/.serverless/**',
      'apps/**/node_modules/**',
      'apps/**/.next/**',
    ],
  },

  ...compat.extends(
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ),

  // 3) Suas customizações
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
      'prettier/prettier': ['error', prettierConfig],
      'no-console': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import/extensions': ['error', 'ignorePackages', { js: 'never', ts: 'never' }],
      'import/no-unresolved': 'off',
      'class-methods-use-this': 'off',
      'no-underscore-dangle': 'off',
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.ts'] },
      },
    },
  },
];
