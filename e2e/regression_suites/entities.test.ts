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
    await testSelectorShot('.row.panels-layout', { threshold: 0.08 });
  });

  it('should display entity details', async () => {
    await expect(page).toClick('div.item-document:first-child');
    await page.waitForNetworkIdle();
    await page.waitForSelector('.metadata.tab-content-visible');
    await testSelectorShot('.metadata-sidepanel', { threshold: 0.08 });
  });

  it('should display relationships on the sidepanel', async () => {
    await expect(page).toClick('#tab-relationships');
    await page.waitForSelector('.sidepanel-relationship-collapsible');
    await testSelectorShot('.metadata-sidepanel', { threshold: 0.08 });
  });

  it('should display entity view page', async () => {
    await page.goto(`${host}/entity/oiejku12qn0zfr`);
    await testSelectorShot('div.app-content', { threshold: 0.08 });
  });

  it('should display entity edit page', async () => {
    await expect(page).toClick('span', { text: 'Edit' });
    await testSelectorShot('div.app-content', { threshold: 0.08 });
  });

  it('should display entity relationship page', async () => {
    await page.goto(`${host}/entity/7amlebw43dw8kt9`);
    await expect(page).toClick('div[aria-label="Relationships"]');
    await page.waitForSelector('.relationships-graph');
    await testSelectorShot('div.app-content', { threshold: 0.08 });
  });

  afterAll(async () => {
    await logout();
  });
});
