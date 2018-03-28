module.exports = {
  name: 'client',
  displayName: 'Client',
  testMatch: [
    '**/react/**/specs/*spec.js?(x)'
  ],
  testPathIgnorePatterns: ['DocumentsList.spec.js'],
  setupTestFrameworkScriptFile: '<rootDir>/setUpJestClient.js',
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  },
  snapshotSerializers: ['enzyme-to-json/serializer']
};
