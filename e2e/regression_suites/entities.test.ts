/*global page*/
import { ElementHandle } from 'puppeteer';

import { ensure } from 'shared/tsUtils';

import { host } from '../config';
import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import { prepareToMatchImageSnapshot } from '../helpers/regression';

prepareToMatchImageSnapshot();

describe('Homepage entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should display entities in homepage', async () => {
    const elementSelector = '.row.panels-layout';
    await page.waitForSelector(elementSelector);
    const elementContainer = ensure<ElementHandle>(await page.$(elementSelector));
    const elementScreenshot = await elementContainer.screenshot();
    expect(elementScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
    });
  });

  it('should display entity details', async () => {
    await expect(page).toClick('div.item-document:first-child');
    await page.waitForSelector('.metadata.tab-content-visible');
    const className = '.metadata-sidepanel';
    await page.waitForSelector(className);
    const homepageScreenshot = ensure<ElementHandle>(await page.$(className));
    expect(await homepageScreenshot.screenshot()).toMatchImageSnapshot();
  });

  it('should display entity view page', async () => {
    await page.goto(`${host}/entity/oiejku12qn0zfr`);
    const className = 'div.entity-metadata';
    await page.waitForSelector(className);
    const viewPage = ensure<ElementHandle>(await page.$(className));
    expect(await viewPage.screenshot()).toMatchImageSnapshot();
  });

//   it('should display entity edit page', async () => {
//     await expect(page).toClick('span', { text: 'Edit' });
//     await disableTransitions();
//     const className = 'div.entity-metadata';
//     await page.waitForSelector(className);
//     const editPage = ensure<ElementHandle>(await page.$(className));
//     expect(await editPage.screenshot()).toMatchImageSnapshot();
//   });

//   it('should display entity connections page', async () => {
//     await page.goto(`${host}/entity/7amlebw43dw8kt9`);
//     await disableTransitions();
//     await expect(page).toClick('div[aria-label="Connections"]');
//     const className = 'div.relationships-graph';
//     await page.waitForSelector(className);
//     const connections = ensure<ElementHandle>(await page.$(className));
//     expect(await connections.screenshot()).toMatchImageSnapshot();
//   });

  afterAll(async () => {
    await logout();
  });
});

