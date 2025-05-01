export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testMatch: ['**/tests/**/*.spec.ts', '**/lib/**/*.spec.ts'],
  testPathIgnorePatterns: ['.serverless'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', 'lib/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 100,
      lines: 90,
      statements: 90,
    },
  },
  coveragePathIgnorePatterns: ['lambda.ts', 'app.ts', 'lib/logger.ts'],
};
