module.exports = {
  name: 'client',
  displayName: 'Client',
  testMatch: [
    '**/react/**/specs/*spec.js?(x)',
    '**/shared/**/specs/*spec.js?(x)'
  ],
  testPathIgnorePatterns: [
    //client
    'Scroller.spec.js',
    'app/react/Viewer/utils/specs/Text.spec.js',
    'DocumentsList.spec.js'
  ],
  setupTestFrameworkScriptFile: '<rootDir>/setUpJestClient.js',
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  }
};
