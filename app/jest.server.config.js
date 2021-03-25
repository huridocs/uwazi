// eslint-disable-next-line import/no-extraneous-dependencies
const { defaults } = require('jest-config');

module.exports = {
  name: 'server',
  displayName: 'Server',
  testMatch: ['**/api/**/specs/*spec.(j|t)s?(x)', '**/shared/**/specs/*spec.(j|t)s?(x)'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestServer.js'],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'd.ts'],
  moduleNameMapper: {
    '^api/(.*)': '<rootDir>/api/$1',
    '^shared/(.*)': '<rootDir>/shared/$1',
  },
};
