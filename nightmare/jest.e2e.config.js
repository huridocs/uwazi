module.exports = {
  name: 'E2E',
  displayName: 'E2E',
  testMatch: ['**/nightmare/**/suite1/*.spec.js?(x)', '**/nightmare/**/suite2/*.spec.js?(x)'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestE2E.js'],
};
