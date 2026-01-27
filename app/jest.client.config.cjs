// eslint-disable-next-line import/no-extraneous-dependencies
const { defaults } = require('jest-config');

module.exports = {
  displayName: 'Client',
  testMatch: ['**/app/react/**/specs/*spec.(j|t)s?(x)'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestClient.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'd.ts'],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
  },
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }],
    '^.*/setUpJestClient\\.js$': ['babel-jest', { rootMode: 'upward' }],
  },
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^#app/(.*)\\.js$': '<rootDir>/react/$1',
    '^#app/(.*)': '<rootDir>/react/$1',
    '^#V2/(.*)\\.js$': '<rootDir>/react/V2/$1',
    '^#V2/(.*)': '<rootDir>/react/V2/$1',
    '^#UI/(.*)\\.js$': '<rootDir>/react/UI/$1',
    '^#UI/(.*)': '<rootDir>/react/UI/$1',
    '^shared/(.*)': '<rootDir>/shared/$1',
    '^app/(.*)': '<rootDir>/react/$1',
    '^app/UI/(.*)': '<rootDir>/react/UI/$1',
    '^uuid$': require.resolve('uuid'),
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(somePkg)|react-dnd|dnd-core|@react-dnd|@huridocs/react-text-selection-handler)',
  ],
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
