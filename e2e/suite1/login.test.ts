/*global page*/

import { host } from '../config.js';
import { adminLogin, logout } from '../helpers/login.js';
import proxyMock from '../helpers/proxyMock.js';
import insertFixtures from '../helpers/insertFixtures.js';
import disableTransitions from '../helpers/disableTransitions.js';

describe('Login', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await disableTransitions();
  });

  it('Should login as admin', async () => {
    await adminLogin();
    await page.goto(`${host}/settings/account`);
    await expect(page).toMatchElement('span', { text: 'Account' });
  });

  it('Should not redirect to login when reloading an authorized route', async () => {
    await page.goto(`${host}/library`);
    await page.goto(`${host}/settings/account`);
    await expect(page).toMatchElement('span', { text: 'Account' });
  });

  it('Should logout', async () => {
    await logout();
    await page.goto(`${host}/settings/account`);
    await expect(page).toMatchElement('button', { text: 'Login' });
  });
});
