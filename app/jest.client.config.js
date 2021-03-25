// eslint-disable-next-line import/no-extraneous-dependencies
const { defaults } = require('jest-config');

module.exports = {
  name: 'client',
  displayName: 'Client',
  testMatch: ['**/react/**/specs/*spec.(j|t)s?(x)'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestClient.js'],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'd.ts'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^shared/(.*)': '<rootDir>/shared/$1',
    '^app/(.*)': '<rootDir>/react/$1',
    '^app/UI/(.*)': '<rootDir>/react/UI/$1',
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
