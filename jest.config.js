module.exports = {
  testMatch: [
    '**/react/**/specs/*spec.js?(x)'
  ],
  testPathIgnorePatterns: [
    'SearchBar.spec.js',
    'Scroller.spec.js',
    'SearchText.spec.js',
    'Connections',
    'Text.spec.js',
    'Attachments',
    'filterActions.spec.js',
    'libraryActions.spec.js',
    'Metadata/actions/specs/actions.spec.js',
    'MainListWrapper.spec.js',
    'EditTranslationForm.spec.js',
    'PDFPage.spec.js',
    'targetDocumentReducer.spec.js',
    'DocumentForm.spec.js',
    'GoogleAnalytics.spec.js',
    'referencesActions.spec.js',
    'Uploads',
    'Multireducer',
    'Notifications'
  ],
  setupTestFrameworkScriptFile: '<rootDir>/setUpJest.js',
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  }
};
