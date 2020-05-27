/*global page*/

import { host } from '../config';

export async function adminLogin() {
  await page.goto(host);
  await expect(page).toClick('a', { text: 'Sign in' });
  await expect(page).toFill('input[name=username]', 'admin');
  await expect(page).toFill('input[name=password]', 'admin');
  await expect(page).toClick('button', { text: 'Login' });
  await page.waitForNavigation();
}

export async function logout() {
  await page.goto(`${host}/settings/account`);
  await expect(page).toClick('a', { text: 'Logout' });
  await page.waitForNavigation();
}
