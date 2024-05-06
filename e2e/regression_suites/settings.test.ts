/* eslint-disable max-statements */
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { prepareToMatchImageSnapshot, testSelectorShot } from '../helpers/regression';

prepareToMatchImageSnapshot();

const selectSettingsPage = async (title: string) => {
  await expect(page).toClick('a.settings-section');
  await expect(page).toClick('span', { text: title });
};

const testSettingsContent = async (selector: string = 'div.settings-content') => {
  await testSelectorShot(selector);
};

describe('Settings', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should display Collection', async () => {
    await selectSettingsPage('Collection');
    await page.waitForSelector('.leafletmap');
    await testSelectorShot('[data-testid="settings-collection"]');
  });

  describe('Templates', () => {
    const getMetadataOptionSelector = (position: number) =>
      `.metadataTemplate-constructor > ul.list-group > li.list-group-item:nth-child(${position}) > button`;

    it('should display Templates page', async () => {
      await selectSettingsPage('Templates');
      await testSettingsContent();
    });

    it('should display new templates page', async () => {
      await selectSettingsPage('Templates');
      await expect(page).toClick('div.settings-footer > a');
      await testSettingsContent();
    });

    it('should display new templates page with more metadata options', async () => {
      await selectSettingsPage('Templates');
      await expect(page).toClick('div.settings-footer > a');
      await expect(page).toClick(getMetadataOptionSelector(2));
      await expect(page).toClick(getMetadataOptionSelector(4));
      await testSettingsContent();
    });
  });

  describe('Thesauri', () => {
    it('should display Thesaurus page', async () => {
      await selectSettingsPage('Thesauri');
      await testSettingsContent('[data-testid="settings-thesauri"]');
    });

    it('should display new Thesaurus page', async () => {
      await selectSettingsPage('Thesauri');
      await expect(page).toClick('a', { text: 'Add thesaurus' });
      await testSettingsContent('[data-testid="settings-thesauri"]');
    });

    it('should display new Thesaurus with groups page', async () => {
      await selectSettingsPage('Thesauri');
      await expect(page).toClick('a', { text: 'Add thesaurus' });
      await expect(page).toClick('button', { text: 'Add group' });
      await expect(page).toFill('input#group-name', 'Group 1');

      await testSettingsContent('aside');
    });
  });

  afterAll(async () => {
    await logout();
  });
});
