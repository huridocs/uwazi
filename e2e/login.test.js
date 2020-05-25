/*global page*/

import { adminLogin, logout } from './helpers/login';
import proxyMock from './helpers/proxyMock';

describe('Login', () => {
  beforeAll(async () => {
    await proxyMock();
  });

  it('Should login as admin', async () => {
    await adminLogin();
  });

  it('Should not redirect to login when reloading an authorized route', async () => {
    await page.goto('http://localhost:3000/settings/account');
    await expect(page.title()).resolves.toMatch('Settings');
    await expect(page).toMatchElement('span', { class: 'translation', text: 'Account' });
  });

  it('Should logout', async () => {
    await logout();
  });

  it('Should unauthorize when trying to access a protected URL', async () => {
    await page.goto('http://localhost:3000/settings/account');
    await expect(page.content()).resolves.toMatch('Unauthorized');
  });
});
