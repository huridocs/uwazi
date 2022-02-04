import { host } from '../config';
import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import {
  IMAGE_REGRESSION_PERCENTAGE as percentage,
  prepareToMatchImageSnapshot,
  testSelectorShot,
} from '../helpers/regression';

prepareToMatchImageSnapshot();

describe('Homepage entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it(`should display entities in homepage with no more than a ${percentage}% difference`, async () => {
    await testSelectorShot('.row.panels-layout');
  });

  it(`should display entity details with no more than a ${percentage}% difference`, async () => {
    await expect(page).toClick('div.item-document:first-child');
    await page.waitForSelector('.metadata.tab-content-visible');
    await testSelectorShot('.metadata-sidepanel');
  });

  it(`should display entity view page with no more than a ${percentage}% difference`, async () => {
    await page.goto(`${host}/entity/oiejku12qn0zfr`);
    await testSelectorShot('div.entity-metadata');
  });

  it(`should display entity edit page with no more than a ${percentage}% difference`, async () => {
    await expect(page).toClick('span', { text: 'Edit' });
    await testSelectorShot('div.entity-metadata');
  });

  it(`should display entity connections page with no more than a ${percentage}% difference`, async () => {
    await page.goto(`${host}/entity/7amlebw43dw8kt9`);
    await expect(page).toClick('div[aria-label="Connections"]');
    await testSelectorShot('div.relationships-graph');
  });

  afterAll(async () => {
    await logout();
  });
});
