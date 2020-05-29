//@ts-ignore
module.exports = {
  launch: {
    dumpio: false,
    headless: true,
    slowMo: 2,
    defaultViewport: null,
    devtools: false,
    args: ['--disable-infobars', '--disable-gpu', '--window-size=1300,800'],
  },
  browserContext: 'default',
};
