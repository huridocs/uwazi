module.exports = {
  name: 'E2E',
  displayName: 'E2E',
  testMatch: ['**/nightmare/**/paths/graphs.spec.js?(x)'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestE2E.js'],
};
