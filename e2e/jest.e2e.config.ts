//@ts-ignore
process.env.JEST_PUPPETEER_CONFIG = require.resolve('./jest-puppeteer.config.ts');

module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['expect-puppeteer', '<rootDir>/setupJestPuppeteer.js'],
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }],
  },
};
