//@ts-ignore
module.exports = {
  launch: {
    dumpio: false,
    headless: true,
    slowMo: 5,
    defaultViewport: null,
    devtools: false,
    args: ['--disable-infobars', '--disable-gpu', '--window-size=1500,1000'],
  },
  browserContext: 'default',
};
