/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
// @ts-ignore
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

const localSelectors = {
  pagesButton:
    '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(5)',
  pageContentsInput:
    '.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea',
  createdPageLink: '.document-viewer > div.alert-info a',
};

const graphs = {
  barChart: '<BarChart property="tipo" context="58ada34c299e8267485450fb" />',
  pieChart: '<PieChart property="tipo" context="58ada34c299e8267485450fb" />',
  listChart:
    '<ListChart property="tipo" context="58ada34c299e8267485450fb" excludeZero="true" />',
};

describe('Graphs in Page', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  it('should create a basic page', async () => {
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });

    await expect(page).toFill('input[name="page.data.title"]', 'Page data viz');
    await expect(page).toFill(localSelectors.pageContentsInput, '</p><Dataset />');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
    await expect(page).toMatch('(view page)');
  });

  it('should insert Bar chart graph in created page', async () => {
    const pageContentsInput = await page.$eval(localSelectors.pageContentsInput, el => (<HTMLInputElement>el).value);
    expect(pageContentsInput).toContain('<Dataset />');

    await page.type(localSelectors.pageContentsInput, graphs.barChart);
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
    await expect(page).toMatch('(view page)');
  });

  it('should display Bar chart graph in page with no more than a 1% difference', async () => {
    const createdPageLink = await page.$eval(localSelectors.createdPageLink, el => (<HTMLLinkElement>el).href);
    await page.goto(createdPageLink);
    const chartsContainerHTML= await page.$eval('div.markdown-viewer', e => (<HTMLElement>e).outerHTML);
    expect(chartsContainerHTML).toContain('class="recharts-responsive-container"');

    await page.evaluate(() => document.querySelector('header').remove());
    await page.evaluate(() => document.querySelector('.footer-nav').remove());
    await page.evaluate(() => document.querySelector('footer').remove());
    // await page.evaluate(() => document.querySelector('#app').style.padding = '0');
    // await page.evaluate(() => document.querySelector('.page-viewer').style.padding = '0');
    // await page.evaluate(() => document.querySelector('.main-wrapper').style.padding = '0');

    const pageScreenshot = await page.screenshot();
    // @ts-ignore
    expect(pageScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  afterAll(async () => {
    await logout();
  });
});
