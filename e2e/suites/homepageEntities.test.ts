/*global page*/
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { ElementHandle } from 'puppeteer';
import { ensure } from 'shared/tsUtils';
import { getContainerScreenshot } from '../helpers/elementSnapshot';
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

  fit('should display entities in homepage with no more than a 7% difference', async () => {
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

  fit('should display entity details with no more than a 7% difference', async () => {
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
    const entityMetadataScreenshot = await getContainerScreenshot(page, 'div.entity-metadata');
    expect(entityMetadataScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display entity edit page with no more than a 7% difference', async () => {
    await expect(page).toClick('span', { text: 'Edit' });
    const entityMetadataFormScreenshot = await getContainerScreenshot(page, 'div.entity-metadata');

    expect(entityMetadataFormScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display entity connections page with no more than a 7% difference', async () => {
    await page.goto(`${host}/entity/7amlebw43dw8kt9`);
    await expect(page).toClick('div[aria-label="Connections"]');

    const entityConnectionsScreenshot = await getContainerScreenshot(
      page,
      'div.relationships-graph'
    );
    expect(entityConnectionsScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  afterAll(async () => {
    await logout();
  });
});
