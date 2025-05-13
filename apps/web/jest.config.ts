import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/actions/(.*)$': '<rootDir>/actions/$1',
    '^@/modules/users$': '<rootDir>/../../modules/users/index.ts',
    '^@/common/(.*)$': '<rootDir>/../../modules/common/$1',
    '^@/prisma$': '<rootDir>/generated/prisma',
    '^@/fabbrica$': '<rootDir>/../../database/src/__generated__/fabbrica',
    '^react$': '<rootDir>/../../node_modules/react',
    '^react-dom$': '<rootDir>/../../node_modules/react-dom',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  collectCoverageFrom: ['app/**/*.tsx', 'components/**/*.tsx'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 100,
      lines: 90,
      statements: 90,
    },
  },
};

export default config;
