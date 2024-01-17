// eslint-disable-next-line import/no-extraneous-dependencies
import { defaults } from 'jest-config';

export default {
  displayName: 'Client',
  testRunner: 'jest-jasmine2',
  testMatch: ['**/react/**/specs/*spec.(j|t)s?(x)'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestClient.js'],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'd.ts'],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
  },
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^shared/(.*)': '<rootDir>/shared/$1',
    '^app/(.*)': '<rootDir>/react/$1',
    '^app/UI/(.*)': '<rootDir>/react/UI/$1',
    '^uuid$': require.resolve('uuid'),
  },
  transformIgnorePatterns: ['/node_modules/(?!(somePkg)|react-dnd|dnd-core|@react-dnd)'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
