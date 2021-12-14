/*global page*/
import { ElementHandle } from 'puppeteer';
import { ensure } from '../../app/shared/tsUtils';
import { host } from '../config';
import { adminLogin, logout } from '../../e2e/helpers/login';
import proxyMock from '../../e2e/helpers/proxyMock';
import insertFixtures from '../../e2e/helpers/insertFixtures';
import disableTransitions from '../../e2e/helpers/disableTransitions';

describe('Homepage entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin(host);
    await disableTransitions();
  });

  it('should display entities in homepage', async () => {
    await page.goto(host, { waitUntil: 'domcontentloaded' });
    await disableTransitions();
    const className = '.row.panels-layout';
    await page.waitForSelector(className);
    const homepageScreenshot = ensure<ElementHandle>(await page.$(className));

    expect(await homepageScreenshot.screenshot()).toMatchImageSnapshot();
  });

  it('should display entity details', async () => {
    await expect(page).toClick('div.item-document:first-child');
    await page.waitForSelector('.metadata.tab-content-visible');
    await page.waitFor(200);
    const className = '.metadata-sidepanel';
    await page.waitForSelector(className);
    const homepageScreenshot = ensure<ElementHandle>(await page.$(className));
    expect(await homepageScreenshot.screenshot()).toMatchImageSnapshot();
  });
  it('should display entity view page', async () => {
    await page.goto(`${host}/entity/oiejku12qn0zfr`, { waitUntil: 'domcontentloaded' });
    await disableTransitions();
    const className = 'div.entity-metadata';
    await page.waitForSelector(className);
    const viewPage = ensure<ElementHandle>(await page.$(className));
    expect(await viewPage.screenshot()).toMatchImageSnapshot();
  });
  it('should display entity edit page', async () => {
    await expect(page).toClick('span', { text: 'Edit' });
    const className = 'div.entity-metadata';
    await page.waitForSelector(className);
    const editPage = ensure<ElementHandle>(await page.$(className));
    expect(await editPage.screenshot()).toMatchImageSnapshot();
  });

  it('should display entity connections page', async () => {
    await page.goto(`${host}/entity/7amlebw43dw8kt9`);
    await disableTransitions();
    await expect(page).toClick('div[aria-label="Connections"]');
    const className = 'div.relationships-graph';
    await page.waitForSelector(className);
    const connections = ensure<ElementHandle>(await page.$(className));
    expect(await connections.screenshot()).toMatchImageSnapshot();
  });

  afterAll(async () => {
    await logout(host);
  });
});
