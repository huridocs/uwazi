/*global page*/
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { ElementHandle } from 'puppeteer';
import { ensure } from 'shared/tsUtils';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

expect.extend({ toMatchImageSnapshot });

const selectSettingsPage = async (title: string) => {
  await expect(page).toClick('a.settings-section');
  await expect(page).toClick('span', { text: title });
};

describe('Settings', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
    await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 2 });
  });

  it('should display Account with no more than a 7% difference', async () => {
    await selectSettingsPage('Account');
    // const accountsScreenshot = await getContainerScreenshot(page, 'div.account-settings');
    const className = 'div.account-settings';
    await page.waitForSelector(className);
    const accountPage = ensure<ElementHandle>(await page.$(className));
    expect(await accountPage.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display Users with no more than a 7% difference', async () => {
    await selectSettingsPage('Users');
    // const usersScreenshot = await getContainerScreenshot(page, 'div.settings-content');
    const className = 'div.settings-content';
    await page.waitForSelector(className);
    const usersPage = ensure<ElementHandle>(await page.$(className));
    expect(await usersPage.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display Collection with no more than a 7% difference', async () => {
    await selectSettingsPage('Collection');
    await page.waitForSelector('.mapboxgl-map');
    // const collectionScreenshot = await getContainerScreenshot(page, 'div.collection-settings');
    const className = 'div.collection-settings';
    await page.waitForSelector(className);
    const collectionsPage = ensure<ElementHandle>(await page.$(className));
    expect(await collectionsPage.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  describe('Pages', () => {
    it('should display create Pages page with no more than a 7% difference', async () => {
      await selectSettingsPage('Pages');
      await expect(page).toClick('.settings-footer > a');
      // const createPageFormScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      const className = 'div.settings-content';
      await page.waitForSelector(className);
      const createPagesPage = ensure<ElementHandle>(await page.$(className));
      expect(await createPagesPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
  });
  describe('Filters', () => {
    it('should display filters page with filters with no more than a 7% difference', async () => {
      await selectSettingsPage('Filters');
      // const filtersScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      const className = 'div.settings-content';
      await page.waitForSelector(className);
      const filtersPage = ensure<ElementHandle>(await page.$(className));
      expect(await filtersPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
    it('should display filter groups with no more than a 7% difference', async () => {
      await selectSettingsPage('Filters');
      await expect(page).toClick('div.settings-footer > button');
      // const filterGroupsScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      const className = 'div.settings-content';
      await page.waitForSelector(className);
      const filtersGroupPage = ensure<ElementHandle>(await page.$(className));
      expect(await filtersGroupPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
  });

  describe('Templates', () => {
    const getMetadataOptionSelector = (position: number) =>
      `.metadataTemplate-constructor > ul.list-group > li.list-group-item:nth-child(${position}) > button`;
    it('should display Templates page with no more than a 7% difference', async () => {
      await selectSettingsPage('Templates');
      // const templatesScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      const className = 'div.settings-content';
      await page.waitForSelector(className);
      const templatesPage = ensure<ElementHandle>(await page.$(className));
      expect(await templatesPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
    it('should display new templates page with no more than a 7% difference', async () => {
      await selectSettingsPage('Templates');
      await expect(page).toClick('div.settings-footer > a');
      // const newTemplateScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      const className = 'div.settings-content';
      await page.waitForSelector(className);
      const newTemplatesPage = ensure<ElementHandle>(await page.$(className));
      expect(await newTemplatesPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });

    it('should display new templates page with more metadata options with no more than a 7% difference', async () => {
      await selectSettingsPage('Templates');
      await expect(page).toClick('div.settings-footer > a');
      await expect(page).toClick(getMetadataOptionSelector(2));
      await expect(page).toClick(getMetadataOptionSelector(4));
      // const newTemplateScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      const className = 'div.settings-content';
      await page.waitForSelector(className);
      const templatesMetadataPage = ensure<ElementHandle>(await page.$(className));
      expect(await templatesMetadataPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });

    describe('Thesauri', () => {
      it('should display Thesaurus page with no more than a 7% difference', async () => {
        await selectSettingsPage('Thesauri');
        // const templatesScreenshot = await getContainerScreenshot(page, 'div.settings-content');
        const className = 'div.settings-content';
        await page.waitForSelector(className);
        const thesaurisPage = ensure<ElementHandle>(await page.$(className));
        expect(await thesaurisPage.screenshot()).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
      it('should display new Thesaurus page with no more than a 7% difference', async () => {
        await selectSettingsPage('Thesauri');
        await expect(page).toClick('div.settings-footer > a');
        // const templatesScreenshot = await getContainerScreenshot(page, 'div.settings-content');
        const className = 'div.settings-content';
        await page.waitForSelector(className);
        const newThesaurisPage = ensure<ElementHandle>(await page.$(className));
        expect(await newThesaurisPage.screenshot()).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
      it('should display new Thesaurus with groups page with no more than a 7% difference', async () => {
        await selectSettingsPage('Thesauri');
        await expect(page).toClick('div.settings-footer > a');
        await expect(page).toClick('div.settings-footer > button');
        await expect(page).toClick('div.settings-footer > button');
        await expect(page).toClick('div.settings-footer > button');
        // const templatesScreenshot = await getContainerScreenshot(page, 'div.settings-content');
        const className = 'div.settings-content';
        await page.waitForSelector(className);
        const newThesauriGroupsPage = ensure<ElementHandle>(await page.$(className));
        expect(await newThesauriGroupsPage.screenshot()).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
    });
  });

  it('should display Languages with no more than a 7% difference', async () => {
    await selectSettingsPage('Languages');
    // const languageScreenshot = await getContainerScreenshot(
    //   page,
    //   '.settings-content > .panel > .list-group:last-child'
    // );
    const className = '.settings-content > .panel > .list-group:last-child';
    await page.waitForSelector(className);
    const languagesPage = ensure<ElementHandle>(await page.$(className));
    expect(await languagesPage.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display Translations with no more than a 7% difference', async () => {
    await selectSettingsPage('Translations');
    // const translationsScreenshot = await getContainerScreenshot(page, 'div.settings-content');
    const className = 'div.settings-content';
    await page.waitForSelector(className);
    const translationsPage = ensure<ElementHandle>(await page.$(className));
    expect(await translationsPage.screenshot()).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  afterAll(async () => {
    await logout();
  });
});
