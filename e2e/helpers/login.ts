/*global page*/

import { host } from '../config';
import disableTransitions from './disableTransitions';

export async function login(username: string, password: string) {
  await page.goto(host);
  await expect(page).toClick('a', { text: 'Sign in' });
  await expect(page).toFill('input[name=username]', username);
  await expect(page).toFill('input[name=password]', password);
  await expect(page).toClick('button', { text: 'Login' });
  await page.waitForNavigation();
  await disableTransitions();
}

export async function adminLogin() {
  await login('admin', 'admin');
}
export async function logout() {
  await page.goto(`${host}/settings/account`);
  await expect(page).toClick('a', { text: 'Logout' });
  await page.waitForNavigation();
}
