export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['.serverless'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/common/(.*)$': '<rootDir>/modules/common/$1',
    '^@/prisma$': '<rootDir>/database/generated/prisma',
    '^@/fabbrica$': '<rootDir>/database/src/__generated__/fabbrica',
  },
};
