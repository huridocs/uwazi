/*global page*/
import { ElementHandle } from 'puppeteer';
import { ensure } from '../../app/shared/tsUtils';
import { adminLogin, logout } from '../../e2e/helpers/login';
import proxyMock from '../../e2e/helpers/proxyMock';
import insertFixtures from '../../e2e/helpers/insertFixtures';
import disableTransitions from '../../e2e/helpers/disableTransitions';

const selectSettingsPage = async (title: string) => {
  await expect(page).toClick('a.settings-section');
  await expect(page).toClick('span', { text: title });
};

const navigateToPage = async (pageName: string, selector: string) => {
  await selectSettingsPage(pageName);
  await page.waitForSelector(selector);
  const fetchedPage = ensure<ElementHandle>(await page.$(selector));
  return fetchedPage.screenshot();
};

const navigateAndClick = async (pageName: string, selector: string) => {
  await selectSettingsPage(pageName);
  await expect(page).toClick(selector);
};

describe('Settings', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should display Account', async () => {
    const screenshot = await navigateToPage('Account', 'div.account-settings');
    expect(screenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display Users', async () => {
    const screenshot = await navigateToPage('Users', 'div.settings-content');
    expect(screenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display Collection', async () => {
    await selectSettingsPage('Collection');
    await page.waitForSelector('.mapboxgl-map');
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
    it('should display create Pages page', async () => {
      await navigateAndClick('Pages', '.settings-footer > a');
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
    it('should display filters page with filters', async () => {
      const screenshot = await navigateToPage('Filters', 'div.settings-content');
      expect(screenshot).toMatchImageSnapshot();
    });
    it('should display filter groups', async () => {
      await navigateAndClick('Filters', 'div.settings-footer > button');
      await page.waitForSelector('div.settings-content');
      const filtersGroupPage = ensure<ElementHandle>(await page.$('div.settings-content'));
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
    it('should display Templates page', async () => {
      const screenshot = await navigateToPage('Templates', 'div.settings-content');
      expect(screenshot).toMatchImageSnapshot();
    });
    it('should display new templates page', async () => {
      await navigateAndClick('Templates', 'div.settings-footer > a');
      await page.waitForSelector('div.settings-content');
      const newTemplatesPage = ensure<ElementHandle>(await page.$('div.settings-content'));
      expect(await newTemplatesPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });

    it('should display new templates page with more metadata options', async () => {
      await navigateAndClick('Templates', 'div.settings-footer > a');
      await expect(page).toClick(getMetadataOptionSelector(2));
      await expect(page).toClick(getMetadataOptionSelector(4));
      await page.waitForSelector('div.settings-content');
      const templatesMetadataPage = ensure<ElementHandle>(await page.$('div.settings-content'));
      expect(await templatesMetadataPage.screenshot()).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });

    describe('Thesauri', () => {
      it('should display Thesaurus page', async () => {
        const screenshot = await navigateToPage('Thesauri', 'div.settings-content');
        expect(screenshot).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
      it('should display new Thesaurus page', async () => {
        await navigateAndClick('Thesauri', 'div.settings-footer > a');
        await page.waitForSelector('div.settings-content');
        const newThesaurisPage = ensure<ElementHandle>(await page.$('div.settings-content'));
        expect(await newThesaurisPage.screenshot()).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
      it('should display new Thesaurus with groups page', async () => {
        await navigateAndClick('Thesauri', 'div.settings-footer > a');
        await expect(page).toClick('div.settings-footer > button');
        await expect(page).toClick('div.settings-footer > button');
        await expect(page).toClick('div.settings-footer > button');
        await page.waitForSelector('div.settings-content');
        const newThesauriGroupsPage = ensure<ElementHandle>(await page.$('div.settings-content'));
        expect(await newThesauriGroupsPage.screenshot()).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
    });
  });

  it('should display Languages', async () => {
    const screenshot = await navigateToPage('Languages', '.settings-content');
    expect(screenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display Translations', async () => {
    const screenshot = await navigateToPage('Translations', 'div.settings-content');
    expect(screenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  afterAll(async () => {
    await logout();
  });
});
