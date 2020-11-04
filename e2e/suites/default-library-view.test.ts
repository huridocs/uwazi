/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';

describe('Entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  it('Should set the default library view to Table', async () => {
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('span', { text: 'Collection' });
    await expect(page).toClick('#table');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await page.waitForSelector(
      'header > ul > li.menuActions > ul.menuNav-list > li:nth-child(1) > a > svg[data-icon="align-justify"]'
    );
  });

  it('Should click the Public Documents button and show the table', async () => {
    await expect(page).toClick('a', { text: 'Public documents' });
    await page.waitForSelector('.tableview-wrapper');
    await expect(page.url()).toMatch('library/table');
  });

  afterAll(async () => {
    await logout();
  });
});
