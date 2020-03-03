module.exports = {
  name: 'E2E',
  displayName: 'E2E',
  testMatch: ['**/nightmare/**/paths/metadata.spec.js?(x)'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestE2E.js'],
};
