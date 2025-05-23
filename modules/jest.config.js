module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/prisma$': '<rootDir>/../database/generated/prisma',
    '^@/fabbrica$': '<rootDir>/../database/src/__generated__/fabbrica',
    '^@/modules/(.*)$': '<rootDir>/$1',
    '^@/common/(.*)$': '<rootDir>/common/$1',
  },
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/dist/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
      },
    ],
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};
