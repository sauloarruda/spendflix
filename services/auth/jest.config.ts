import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/lib'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', 'lib/**/*.ts', '!**/*.d.ts', '!**/*.spec.ts'],
  coveragePathIgnorePatterns: ['lambda.ts', 'app.ts', 'lib/logger.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
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
