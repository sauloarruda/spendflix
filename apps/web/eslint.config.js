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

  ...compat.extends('next/core-web-vitals', 'plugin:prettier/recommended'),

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
    },
  },
];
