module.exports = {
  testMatch: [
    '**/react/**/specs/*spec.js?(x)'
    //'**/api/**/specs/*spec.js?(x)'
  ],
  //testEnvironment: 'node',
  testPathIgnorePatterns: [
    //client
    'Scroller.spec.js',
    'app/react/Viewer/utils/specs/Text.spec.js',
    'DocumentsList.spec.js'
    //server
    //'app/api/upload/'
  ],
  setupTestFrameworkScriptFile: '<rootDir>/setUpJest.js',
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  }
};
