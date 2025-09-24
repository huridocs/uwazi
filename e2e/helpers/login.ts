/*global page*/

import { host } from '../config';
import disableTransitions from './disableTransitions';

export async function login(username: string, password: string) {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.goto(host);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForNetworkIdle();
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('a[aria-label="Sign in"]');
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toFill('input[name=username]', username);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toFill('input[name=password]', password);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('button', { text: 'Login' });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForNavigation();
  await disableTransitions();
}

export async function adminLogin() {
  await login('admin', 'admin');
}
export async function logout() {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.goto(`${host}/en/settings/account`);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('[data-testid="account-logout"]');
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForNavigation();
}
