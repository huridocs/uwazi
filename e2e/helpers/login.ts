/*global page*/

import { host as defaultHost } from '../config';

export async function login(username: string, password: string, baseHost: string | undefined) {
  const host = baseHost || defaultHost;
  await page.goto(host);
  await expect(page).toClick('a', { text: 'Sign in' });
  await expect(page).toFill('input[name=username]', username);
  await expect(page).toFill('input[name=password]', password);
  await expect(page).toClick('button', { text: 'Login' });
  await page.waitForNavigation();
}

export async function adminLogin(baseHost: string | undefined) {
  const host = baseHost || defaultHost;
  await login('admin', 'admin', host);
}
export async function logout(baseHost: string | undefined) {
  const host = baseHost || defaultHost;
  await page.goto(`${host}/settings/account`);
  await expect(page).toClick('a', { text: 'Logout' });
  await page.waitForNavigation();
}
