module.exports = {
  name: 'server',
  displayName: 'Server',
  testMatch: [
    '**/api/**/specs/*spec.js?(x)',
    '**/shared/**/specs/*spec.js?(x)'
  ],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    'app/api/upload/'
  ],
  setupTestFrameworkScriptFile: '<rootDir>/setUpJestServer.js'
};
