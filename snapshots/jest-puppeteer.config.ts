const getConfig = require('jest-puppeteer-docker/lib/config');

const baseConfig = getConfig();
const customConfig = { ...baseConfig };

customConfig.connect.defaultViewport = {
  width: 1500,
  height: 1000,
  setDeviceScaleFactor: 1,
};

customConfig.chromiumFlags = ['--ignore-certificate-errors'];

module.exports = customConfig;
