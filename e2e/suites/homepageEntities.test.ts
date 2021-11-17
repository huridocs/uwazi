/*global page*/
import { ensure } from 'shared/tsUtils';
import { ElementHandle } from 'puppeteer';
import sharp from 'sharp';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { host } from '../config';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

expect.extend({ toMatchImageSnapshot });

const resizeImage = async (image: any, length: number, width: number) =>
  sharp(image)
    .resize(length, width)
    .toBuffer();

describe('Homepage entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
    await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 4 });
  });

  it('should display entities in homepage with no more than a 7% difference', async () => {
    await expect(page).toClick('a', { text: 'Uwazi' });
    const homepageContainer = ensure<ElementHandle>(await page.$('.row.panels-layout'));

    const homepageScreenshot = await homepageContainer.screenshot();
    // fs.writeFile('homepage.png', Buffer.from(homepageScreenshot, 'base64'), (err: any) => {
    //   if (err) console.log('Error');
    //   console.log('Done');
    // });
    const resizedHomepageScreenshot = await resizeImage(homepageScreenshot, 1950, 944);
    expect(resizedHomepageScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display entity details with no more than a 7% difference', async () => {
    await expect(page).toClick('div.item-document:first-child');

    const entityDetailsContainer = ensure<ElementHandle>(await page.$('.metadata-sidepanel'));
    const entityDetailsScreenshot = await entityDetailsContainer.screenshot();
    const resizedEntityDetailsScreenshot = await resizeImage(entityDetailsScreenshot, 600, 942);
    expect(resizedEntityDetailsScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display entity view page with no more than a 7% difference', async () => {
    // await expect(page).toClick('div.item-document');
    await page.goto(`${host}/entity/oiejku12qn0zfr`);
    // await expect(page).toClick('span', { text: 'View' });

    const entityMetadataContainer = ensure<ElementHandle>(await page.$('div.entity-metadata'));
    const entityMetadataScreenshot = await entityMetadataContainer.screenshot();
    const resizedEntityMetadataScreenshot = await resizeImage(entityMetadataScreenshot, 1305, 783);
    expect(resizedEntityMetadataScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display entity edit page with no more than a 7% difference', async () => {
    await expect(page).toClick('span', { text: 'Edit' });
    const entityMetadataFormContainer = ensure<ElementHandle>(await page.$('div.entity-metadata'));
    const entityMetadataFormScreenshot = await entityMetadataFormContainer.screenshot({
      // clip: { x: 0, y: 0, width: 1305, height: 786 },
    });
    const resizedEntityMetadataFormScreenshot = await resizeImage(
      entityMetadataFormScreenshot,
      1305,
      783
    );
    expect(resizedEntityMetadataFormScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display entity connections page with no more than a 7% difference', async () => {
    await page.goto(`${host}/entity/7amlebw43dw8kt9`);
    await expect(page).toClick('div[aria-label="Connections"]');
    const entityConnectionsContainer = ensure<ElementHandle>(
      await page.$('div.relationships-graph')
    );
    const entityConnectionsScreenshot = await entityConnectionsContainer.screenshot();
    const resizedEntityMetadataFormScreenshot = await resizeImage(
      entityConnectionsScreenshot,
      1305,
      783
    );
    expect(resizedEntityMetadataFormScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  afterAll(async () => {
    await logout();
  });
});
