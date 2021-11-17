/*global page*/
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { getContainerScreenshot } from '../helpers/elementSnapshot';

expect.extend({ toMatchImageSnapshot });

describe('Settings', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
    await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 2 });
  });

  it('should display Account with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Account' });
    // await page.waitForSelector('div.account-settings');
    const accountsScreenshot = await getContainerScreenshot(page, 'div.account-settings');
    expect(accountsScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display Users with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Users' });
    const usersScreenshot = await getContainerScreenshot(page, 'div.settings-content');
    expect(usersScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display Collection with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Collection' });
    await page.waitForSelector('.mapboxgl-map');
    const collectionScreenshot = await getContainerScreenshot(page, 'div.collection-settings');
    expect(collectionScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  describe('Pages', () => {
    it('should display create Pages page with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Pages' });
      await expect(page).toClick('.settings-footer > a');
      const createPageFormScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      expect(createPageFormScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
  });
  describe('Filters', () => {
    it('should display filters page with filters with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Filters' });
      const filtersScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      expect(filtersScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
    it('should display filter groups with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Filters' });
      await expect(page).toClick('div.settings-footer > button');
      const filterGroupsScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      expect(filterGroupsScreenshot).toMatchImageSnapshot({
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
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Templates' });
      const templatesScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      expect(templatesScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
    it('should display new templates page with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Templates' });
      await expect(page).toClick('div.settings-footer > a');
      const newTemplateScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      expect(newTemplateScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });

    it('should display new templates page with more metadata options with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Templates' });
      await expect(page).toClick('div.settings-footer > a');
      await expect(page).toClick(getMetadataOptionSelector(2));
      await expect(page).toClick(getMetadataOptionSelector(4));
      const newTemplateScreenshot = await getContainerScreenshot(page, 'div.settings-content');
      expect(newTemplateScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });

    describe('Thesauri', () => {
      it('should display Thesaurus page with no more than a 7% difference', async () => {
        await expect(page).toClick('a.settings-section');
        await expect(page).toClick('span', { text: 'Thesauri' });
        const templatesScreenshot = await getContainerScreenshot(page, 'div.settings-content');
        expect(templatesScreenshot).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
      it('should display new Thesaurus page with no more than a 7% difference', async () => {
        await expect(page).toClick('a.settings-section');
        await expect(page).toClick('span', { text: 'Thesauri' });
        await expect(page).toClick('div.settings-footer > a');
        const templatesScreenshot = await getContainerScreenshot(page, 'div.settings-content');
        expect(templatesScreenshot).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
      it('should display new Thesaurus with groups page with no more than a 7% difference', async () => {
        await expect(page).toClick('a.settings-section');
        await expect(page).toClick('span', { text: 'Thesauri' });
        await expect(page).toClick('div.settings-footer > a');
        await expect(page).toClick('div.settings-footer > button');
        await expect(page).toClick('div.settings-footer > button');
        await expect(page).toClick('div.settings-footer > button');
        const templatesScreenshot = await getContainerScreenshot(page, 'div.settings-content');
        expect(templatesScreenshot).toMatchImageSnapshot({
          failureThreshold: 0.07,
          failureThresholdType: 'percent',
          allowSizeMismatch: true,
        });
      });
    });
  });

  it('should display Languages with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Languages' });
    const languageScreenshot = await getContainerScreenshot(
      page,
      '.settings-content > .panel > .list-group:last-child'
    );
    expect(languageScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display Translations with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Translations' });
    const translationsScreenshot = await getContainerScreenshot(page, 'div.settings-content');
    expect(translationsScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  afterAll(async () => {
    await logout();
  });
});
