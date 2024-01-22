import { host } from '../config';
import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import { scrollTo } from '../helpers/formActions';
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
    await expect(page).toClick('div.item-document:first-child');
    await expect(page).toClick('#tab-relationships');
    await page.waitForSelector('#tabpanel-relationships');
    await testSelectorShot('.metadata-sidepanel', { threshold: 0.08 });
  });

  it('should display entity view page', async () => {
    await page.goto(`${host}/entity/oiejku12qn0zfr`);
    await testSelectorShot('main.app-content', { threshold: 0.08 });
  });

  it('should display entity edit page', async () => {
    await expect(page).toClick('span', { text: 'Edit' });
    await testSelectorShot('main.app-content', { threshold: 0.08 });
  });

  it('should display entity relationship page', async () => {
    await page.goto(`${host}/entity/7amlebw43dw8kt9`);
    await disableTransitions();
    await page.waitForSelector('div.page-wrapper');
    await expect(page).toClick('div[aria-label="Relationships"]');
    await testSelectorShot('main.app-content', { threshold: 0.08 });
  });

  it('should display the related entity on the sidepanel', async () => {
    await page.goto(`${host}/entity/7ycel666l65vobt9`);
    await expect(page).toClick('div[aria-label="Relationships"]');
    await page.waitForSelector('.relationships-graph');
    await expect(page).toClick('.item-name', {
      text: 'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
    });
    await page.waitForSelector('aside.side-panel > .sidepanel-body > .view > .item-info');
    await testSelectorShot('aside.side-panel > .sidepanel-body', { threshold: 0.08 });
  });

  it('should display the supporting files of the related entity on the sidepanel', async () => {
    await scrollTo('aside.side-panel > .sidepanel-body > .attachments-list-parent');
    await testSelectorShot('aside.side-panel > .sidepanel-body', { threshold: 0.08 });
  });

  afterAll(async () => {
    await logout();
  });
});
