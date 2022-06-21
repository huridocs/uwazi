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
      await expect(page).toClick('a', { text: '30 more' });
      await expect(page).toMatchElement('.documents-counter', { text: '60' });
      const documents = await page.$$('.item-document');
      expect(documents.length).toBe(60);
    });
  });

  describe('default library view', () => {
    it('Should set the default library view to Table', async () => {
      await expect(page).toClick('a', { text: 'Settings' });
      await expect(page).toClick('span', { text: 'Collection' });
      await expect(page).toSelect('select[name="defaultLibraryView"]', 'Table');
      await expect(page).toMatchElement('button', { text: 'Save' });
      await expect(page).toClick('button', { text: 'Save' });
      await page.waitForSelector(
        'header > ul > li.menuActions > ul.menuNav-list > li:nth-child(1) > a > svg[data-icon="align-justify"]'
      );
    });

    it('Should click the Library button and show the table', async () => {
      await expect(page).toClick('a', { text: 'Library' });
      await page.waitForSelector('.tableview-wrapper');
      await expect(page.url()).toMatch('library/table');
    });

    it('Should show the table view in the home page', async () => {
      await page.goto(`${host}/library/table`);
      await page.waitForSelector('.tableview-wrapper > table > tbody > tr');
    });

    it('Should click the Library footer link and show the table', async () => {
      await expect(page).toClick('.documents-list > div > footer > ul > li:nth-child(5) > a');
      await page.waitForSelector('.tableview-wrapper');
      await expect(page.url()).toMatch('library/table');
    });
  });
});
