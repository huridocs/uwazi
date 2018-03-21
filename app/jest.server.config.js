module.exports = {
  name: 'server',
  displayName: 'Server',
  testMatch: [
    '**/api/**/specs/*spec.js?(x)',
    '**/shared/**/specs/*spec.js?(x)'
  ],
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: '<rootDir>/setUpJestServer.js'
};
