//eslint-disable-next-line
const { setDefaultOptions } = require('expect-puppeteer');

setDefaultOptions({ timeout: 50000 });
jest.setTimeout(40000);
