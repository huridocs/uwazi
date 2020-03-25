module.exports = {
  name: 'server',
  displayName: 'Server',
  testMatch: ['**/api/**/specs/*spec.(j|t)s?(x)', '**/shared/**/specs/*spec.(j|t)s?(x)'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setUpJestServer.js'],
  collectCoverageFrom: ['app/**/*.{js,jsx}'],
  coverageDirectory: 'coverage',
  coverageReporters: ['none'],
};
