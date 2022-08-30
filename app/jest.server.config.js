// eslint-disable-next-line import/no-extraneous-dependencies
const { defaults } = require('jest-config');

module.exports = {
  testRunner: 'jest-jasmine2',
  displayName: 'Server',
  testMatch: ['**/api/**/specs/*spec.(j|t)s?(x)', '**/shared/**/specs/*spec.(j|t)s?(x)'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestServer.js'],
  globalSetup: '<rootDir>/jestServerGlobalSetup.js',
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'd.ts'],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
  },
  fakeTimers: {
    legacyFakeTimers: true,
  },
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  moduleNameMapper: {
    '^api/(.*)': '<rootDir>/api/$1',
    '^shared/(.*)': '<rootDir>/shared/$1',
  },
};
