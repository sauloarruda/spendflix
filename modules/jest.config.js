module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/prisma$': '<rootDir>/../database/generated/prisma',
    '^@/fabbrica$': '<rootDir>/../database/src/__generated__/fabbrica',
    '^@/(.*)$': '<rootDir>/$1',
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
  setupFiles: ['dotenv/config'],
};
