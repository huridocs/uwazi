//@ts-ignore
const config = require('./config.js');

module.exports = {
  launch: {
    dumpio: false,
    headless: true,
    slowMo: 7,
    defaultViewport: null,
    devtools: false,
    args: [
      '--disable-infobars',
      '--disable-gpu',
      '--use-gl=desktop',
      `--window-size=${config.BROWSER_WINDOW_SIZE.width},${config.BROWSER_WINDOW_SIZE.height}`,
    ],
  },
  browserContext: 'default',
};
