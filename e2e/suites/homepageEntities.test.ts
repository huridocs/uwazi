/*global page*/
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { ElementHandle } from 'puppeteer';
import { ensure } from 'shared/tsUtils';
import { host } from '../config';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

expect.extend({ toMatchImageSnapshot });

describe('Homepage entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
    await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 1 });
  });

  it('should display entities in homepage with no more than a 7% difference', async () => {
    await page.goto(host, { waitUntil: 'domcontentloaded' });
    // await expect(page).toClick('a', { text: 'Uwazi' });
    const className = '.row.panels-layout';
    // const homepageScreenshot = await getContainerScreenshot(page, '.row.panels-layout');
    await page.waitForSelector(className);
    const homepageScreenshot = ensure<ElementHandle>(await page.$(className));

    expect(await homepageScreenshot.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display entity details with no more than a 7% difference', async () => {
    await disableTransitions();
    await expect(page).toClick('div.item-document:first-child');
    await page.waitForSelector('.metadata.tab-content-visible');
    await page.waitFor(200);
    const className = '.metadata-sidepanel';
    // const homepageScreenshot = await getContainerScreenshot(page, '.row.panels-layout');
    await page.waitForSelector(className);
    const homepageScreenshot = ensure<ElementHandle>(await page.$(className));
    // const entityDetailsScreenshot = await getContainerScreenshot(page, '.metadata-sidepanel');
    expect(await homepageScreenshot.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display entity view page with no more than a 7% difference', async () => {
    await page.goto(`${host}/entity/oiejku12qn0zfr`, { waitUntil: 'domcontentloaded' });
    const className = 'div.entity-metadata';
    await page.waitForSelector(className);
    const viewPage = ensure<ElementHandle>(await page.$(className));
    expect(await viewPage.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display entity edit page with no more than a 7% difference', async () => {
    await expect(page).toClick('span', { text: 'Edit' });
    const className = 'div.entity-metadata';
    await page.waitForSelector(className);
    const editPage = ensure<ElementHandle>(await page.$(className));
    expect(await editPage.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display entity connections page with no more than a 7% difference', async () => {
    await page.goto(`${host}/entity/7amlebw43dw8kt9`);
    await expect(page).toClick('div[aria-label="Connections"]');
    const className = 'div.relationships-graph';
    await page.waitForSelector(className);
    const connections = ensure<ElementHandle>(await page.$(className));
    expect(await connections.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  afterAll(async () => {
    await logout();
  });
});
