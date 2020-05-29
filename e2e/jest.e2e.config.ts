//@ts-ignore
process.env.JEST_PUPPETEER_CONFIG = require.resolve('./jest-puppeteer.config.ts');
// jest.setTimeout(30000);

module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['<rootDir>/setupJestPuppeteer.js'],
};
