module.exports = {
  name: 'client',
  displayName: 'Client',
  testMatch: [
    '**/react/**/specs/*spec.js?(x)'
  ],
  testPathIgnorePatterns: [
    //client
    'Scroller.spec.js',
    'DocumentsList.spec.js'
  ],
  setupTestFrameworkScriptFile: '<rootDir>/setUpJestClient.js',
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  }
};
