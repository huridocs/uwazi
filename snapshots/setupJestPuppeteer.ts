import { setDefaultOptions } from 'expect-puppeteer';

setDefaultOptions({ timeout: 2000 });
jest.setTimeout(40000);
