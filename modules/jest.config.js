module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/prisma': '<rootDir>/../database/generated/prisma',
    '^@/fabbrica': '<rootDir>/../database/src/__generated__/fabbrica',
    '^@/modules/(.*)$': '<rootDir>/$1',
    '^@/common/(.*)$': '<rootDir>/common/$1',
    '^@/factories$': '<rootDir>/test/factories.ts',
  },
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/dist/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['transactions/*.ts', 'categorization/*.ts', 'common/*.ts', 'users/*.ts'],
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
