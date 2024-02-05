//@ts-ignore
const config = require('./config.js');

module.exports = {
  launch: {
    dumpio: false,
    headless: false,
    slowMo: 70,
    defaultViewport: null,
    devtools: false,
    args: [
      '--disable-infobars',
      '--disable-gpu',
      `--window-size=${config.BROWSER_WINDOW_SIZE.width},${config.BROWSER_WINDOW_SIZE.height}`,
    ],
  },
  browserContext: 'default',
};
