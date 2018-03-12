module.exports = {
  testMatch: [
    '**/react/**/specs/*spec.js?(x)'
  ],
  testPathIgnorePatterns: [
    'Scroller.spec.js',
    'app/react/Viewer/utils/specs/Text.spec.js',
    'DocumentsList.spec.js'
  ],
  setupTestFrameworkScriptFile: '<rootDir>/setUpJest.js',
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  }
};
