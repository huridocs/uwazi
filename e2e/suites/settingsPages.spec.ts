/*global page*/
import { ensure } from 'shared/tsUtils';
import { ElementHandle } from 'puppeteer';
import sharp from 'sharp';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

expect.extend({ toMatchImageSnapshot });

const resizeImage = async (image: any, length: number, width: number) =>
  sharp(image)
    .resize(length, width)
    .toBuffer();

describe('Settings', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
    await page.setViewport({ width: 1800, height: 1000, deviceScaleFactor: 2 });
  });

  it('should display Account with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Account' });
    const accountsContainer = ensure<ElementHandle>(await page.$('div.account-settings'));
    // await page.waitFor(5000);
    const accountsScreenshot = await accountsContainer.screenshot();

    const resizedAccountsScreenshot = await resizeImage(accountsScreenshot, 1508, 1317);
    expect(resizedAccountsScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });
  it('should display Users with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Users' });
    const accountsContainer = ensure<ElementHandle>(await page.$('div.settings-content'));
    // await page.waitFor(5000);
    const accountsScreenshot = await accountsContainer.screenshot({ path: 'screenshot.png' });

    const resizedAccountsScreenshot = await resizeImage(accountsScreenshot, 1508, 1317);
    expect(resizedAccountsScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display Collection with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Collection' });
    const collectionContainer = ensure<ElementHandle>(await page.$('div.collection-settings'));
    // await page.waitFor(5000);
    const collectionScreenshot = await collectionContainer.screenshot();

    const resizedCollectionScreenshot = await resizeImage(collectionScreenshot, 1508, 1317);
    expect(resizedCollectionScreenshot).toMatchImageSnapshot({
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
      const createPageFormContainer = ensure<ElementHandle>(await page.$('div.settings-content'));
      await page.waitFor(5000);
      const createPageFormScreenshot = await createPageFormContainer.screenshot();

      const resizedCreatePageScreenshot = await resizeImage(createPageFormScreenshot, 1508, 1317);
      expect(resizedCreatePageScreenshot).toMatchImageSnapshot({
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
      const createPageFormContainer = ensure<ElementHandle>(await page.$('div.settings-content'));
      // await page.waitFor(5000);
      const createPageFormScreenshot = await createPageFormContainer.screenshot();

      const resizedCreatePageScreenshot = await resizeImage(createPageFormScreenshot, 1508, 1317);
      expect(resizedCreatePageScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
    it('should display filters page with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Filters' });
      await expect(page).toClick('div.list-group-item:first-child > div > button');
      const createPageFormContainer = ensure<ElementHandle>(await page.$('div.settings-content'));
      // await page.waitFor(5000);
      const createPageFormScreenshot = await createPageFormContainer.screenshot();

      const resizedCreatePageScreenshot = await resizeImage(createPageFormScreenshot, 1508, 1317);
      expect(resizedCreatePageScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
    it('should display filter groups with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Filters' });
      await expect(page).toClick('div.settings-footer > button');
      const createPageFormContainer = ensure<ElementHandle>(await page.$('div.settings-content'));
      // await page.waitFor(5000);
      const createPageFormScreenshot = await createPageFormContainer.screenshot();

      const resizedCreatePageScreenshot = await resizeImage(createPageFormScreenshot, 1508, 1317);
      expect(resizedCreatePageScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
  });

  describe('Templates', () => {
    it('should display Templates page with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Templates' });
      const createPageFormContainer = ensure<ElementHandle>(await page.$('div.settings-content'));
      // await page.waitFor(5000);
      const createPageFormScreenshot = await createPageFormContainer.screenshot();

      const resizedCreatePageScreenshot = await resizeImage(createPageFormScreenshot, 1508, 1317);
      expect(resizedCreatePageScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
    it('should display new templates page with no more than a 7% difference', async () => {
      await expect(page).toClick('a.settings-section');
      await expect(page).toClick('span', { text: 'Templates' });
      await expect(page).toClick('div.settings-footer > a');
      const createPageFormContainer = ensure<ElementHandle>(await page.$('div.settings-content'));
      // await page.waitFor(5000);
      const createPageFormScreenshot = await createPageFormContainer.screenshot();

      const resizedCreatePageScreenshot = await resizeImage(createPageFormScreenshot, 1508, 1317);
      expect(resizedCreatePageScreenshot).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
    });
  });

  it('should display Languages with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Languages' });
    const languageContainer = ensure<ElementHandle>(
      await page.$('.settings-content > .panel > .list-group:last-child')
    );
    // await page.waitFor(5000);
    const languageScreenshot = await languageContainer.screenshot();

    const resizedCollectionScreenshot = await resizeImage(languageScreenshot, 1508, 1317);
    expect(resizedCollectionScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  it('should display Translations with no more than a 7% difference', async () => {
    await expect(page).toClick('a.settings-section');
    await expect(page).toClick('span', { text: 'Translations' });
    const translationsContainer = ensure<ElementHandle>(await page.$('div.settings-content'));
    // await page.waitFor(5000);
    const translationsScreenshot = await translationsContainer.screenshot();

    const resizedTranslationsScreenshot = await resizeImage(translationsScreenshot, 1508, 1317);
    expect(resizedTranslationsScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.07,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
  });

  afterAll(async () => {
    await logout();
  });
});
