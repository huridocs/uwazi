import { host } from '../config';
import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import { prepareToMatchImageSnapshot, testSelectorShot } from '../helpers/regression';

prepareToMatchImageSnapshot();

describe('Homepage entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  beforeEach(async () => {
    await disableTransitions();
  });

  it('should display entities in homepage', async () => {
    await testSelectorShot('.row.panels-layout');
  });

  it('should display entity details', async () => {
    await expect(page).toClick('div.item-document:first-child');
    await page.waitForSelector('.metadata.tab-content-visible');
    await testSelectorShot('.metadata-sidepanel');
  });

  it('should display entity view page', async () => {
    await page.goto(`${host}/entity/oiejku12qn0zfr`);
    await testSelectorShot('div.entity-metadata');
  });

  it('should display entity edit page', async () => {
    await expect(page).toClick('span', { text: 'Edit' });
    await testSelectorShot('div.entity-metadata');
  });

  it('should display entity connections page', async () => {
    await page.goto(`${host}/entity/7amlebw43dw8kt9`);
    await expect(page).toClick('div[aria-label="Connections"]');
    await testSelectorShot('div.relationships-graph');
  });

  afterAll(async () => {
    await logout();
  });
});
