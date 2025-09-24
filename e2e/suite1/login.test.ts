/*global page*/

import { host } from '../config';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

describe('Login', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await disableTransitions();
  });

  it('Should login as admin', async () => {
    await adminLogin();
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.goto(`${host}/settings/account`);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toMatchElement('span', { text: 'Account' });
  });

  it('Should not redirect to login when reloading an authorized route', async () => {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.goto(`${host}/library`);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.goto(`${host}/settings/account`);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toMatchElement('span', { text: 'Account' });
  });

  it('Should logout', async () => {
    await logout();
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.goto(`${host}/settings/account`);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toMatchElement('button', { text: 'Login' });
  });
});
