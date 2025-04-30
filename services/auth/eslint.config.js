const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({ baseDirectory: __dirname });
const prettierConfig = require('../../.prettierrc.json');

module.exports = [
  {
    ignores: [
      'eslint.config.js',
      'jest.config.ts',
      'serverless.ts',
      '**/types/api.d.ts',
      'node_modules/**',
      '.serverless/**',
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
        typescript: {},
        node: {
          paths: ['apps/web/lib', 'apps/web/components', 'apps/web/app', 'src'],
          extensions: ['.js', '.ts', '.d.ts', '.tsx'],
          alias: {
            '@/components': './apps/web/components',
            '@/lib': './apps/web/lib',
          },
        },
      },
    },
  },
];
