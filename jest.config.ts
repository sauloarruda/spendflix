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
  collectCoverageFrom: ['modules/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 100,
      lines: 90,
      statements: 90,
    },
  },
  coveragePathIgnorePatterns: ['lambda.ts', 'app.ts', 'common/logger.ts', 'common/config.ts'],
  moduleNameMapper: {
    '^@/common/(.*)$': '<rootDir>/modules/common/$1',
    '^@/prisma$': '<rootDir>/database/generated/prisma',
    '^@/fabbrica$': '<rootDir>/database/src/__generated__/fabbrica',
  },
};
