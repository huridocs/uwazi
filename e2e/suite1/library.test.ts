/*global page*/

import { host } from '../config';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';

describe('Library', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  afterAll(async () => {
    await logout();
  });

  describe('Load more documents', () => {
    it('should Load more', async () => {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('a', { text: '30 more' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('.documents-counter', { text: '60' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      const documents = await page.$$('.item-document');
      expect(documents.length).toBe(60);
    });
  });

  describe('default library view', () => {
    it('Should set the default library view to Table', async () => {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('a', { text: 'Settings' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('span', { text: 'Collection' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toSelect('select[name="defaultLibraryView"]', 'Table');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('button', { text: 'Save' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('button', { text: 'Save' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForSelector(
        'header > ul > li.menuActions > ul.menuNav-list > li:nth-child(1) > a > svg[data-icon="align-justify"]'
      );
    });

    it('Should click the Library button and show the table', async () => {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('a', { text: 'Library' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForSelector('.tableview-wrapper');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page.url()).toMatch('library/table');
    });

    it('Should show the table view in the home page', async () => {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.goto(`${host}/library/table`);
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForSelector('.tableview-wrapper > table > tbody > tr');
    });

    it('Should click the Library footer link and show the table', async () => {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.documents-list > div > footer > ul > li:nth-child(5) > a');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForSelector('.tableview-wrapper');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page.url()).toMatch('library/table');
    });
  });
});
