process.env.JEST_PUPPETEER_CONFIG = require.resolve('./jest-puppeteer.config.ts');

module.exports = {
  preset: 'jest-puppeteer',
};
