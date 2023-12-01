//eslint-disable-next-line
const { setDefaultOptions } = require('expect-puppeteer');

setDefaultOptions({ timeout: 3000 });
jest.setTimeout(40000);
