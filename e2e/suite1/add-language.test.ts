/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

describe('Add language', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  // eslint-disable-next-line max-statements
  it('Should add the first language successfully', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('span', { text: 'Languages' });
    await expect(page).toClick('button', { text: 'Add language' });
    await page.waitForSelector('div.modal-content');
    await expect(page).toFill('div.modal-content div.modal-body input', 'CONFIRM');
    await expect(page).toClick('span', { text: 'Accept' });
    await expect(page).toMatch('New language added');
  });

  it('should show the added language in the translation context', async () => {
    await expect(page).toClick('span', { text: 'Translations' });
    await expect(page).toClick('a', { text: 'Estado' });
    await expect(page).toMatch('ab');
  });

  it('should delete the added language', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('span', { text: 'Languages' });
    await expect(page).toClick('.installed-languages > div:nth-child(4) > div:nth-child(4)', {
      text: 'Delete language',
    });
    await page.waitForSelector('div.modal-content');
    await expect(page).toFill('div.modal-content div.modal-body input', 'CONFIRM');
    await expect(page).toClick('span', { text: 'Accept' });
    await expect(page).toMatch('Language deleted');
  });

  afterAll(async () => {
    await logout();
  });
});
