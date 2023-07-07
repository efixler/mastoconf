module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['/**/*.spec.ts?(x)'],
    testPathIgnorePatterns: ['/dist/'],
  };