module.exports = {
  testMatch: [
    '**/react/**/specs/*spec.js?(x)'
  ],
  testPathIgnorePatterns: [
    'Scroller.spec.js',
    'app/react/Viewer/utils/specs/Text.spec.js',
    'Attachments',
    'DocumentsList.spec.js',
    'PDFPage.spec.js',
    'UploadsRoute.spec.js',
    'uploadsActions.spec.js',
    'Relationships'
  ],
  setupTestFrameworkScriptFile: '<rootDir>/setUpJest.js',
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  }
};
