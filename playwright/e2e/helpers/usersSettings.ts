import { execSync } from 'child_process';
import { expect, Page } from '@playwright/test';

export async function gotoWithRetry(url: string, page: Page) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (error) {
    if (`${error}`.includes('ERR_ABORTED')) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return;
    }
    throw error;
  }
}

export function restoreBlankFixtures() {
  execSync('yarn blank-e2e-fixtures', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_NAME: 'uwazi_e2e',
      INDEX_NAME: 'uwazi_e2e',
    },
  });
}

export async function fillConfirmationModalPassword(page: Page, password: string) {
  const modal = page.getByTestId('modal');
  await expect(modal).toBeVisible();
  await modal.locator('#confirm-password').fill(password);
  const usersResponse = page.waitForResponse(
    response => response.url().includes('/api/users') && response.status() < 400
  );
  await modal.getByTestId('accept-button').click();
  await usersResponse;
  await expect(modal).toBeHidden();
}

export async function submitConfirmationExpectingStatus(
  page: Page,
  password: string,
  urlIncludes: string,
  expectedStatuses: number[]
) {
  const modal = page.getByTestId('modal');
  await expect(modal).toBeVisible();
  await modal.locator('#confirm-password').fill(password);
  const responsePromise = page.waitForResponse(
    response => response.url().includes(urlIncludes) && response.request().method() !== 'GET'
  );
  await modal.getByTestId('accept-button').click();
  const response = await responsePromise;
  expect(expectedStatuses).toContain(response.status());
}

export async function openUsersSettings(page: Page) {
  await gotoWithRetry('/settings/users', page);
  await expect(page.getByTestId('settings-users')).toBeVisible();
}

export async function createUserViaUi(
  page: Page,
  {
    username,
    email,
    password,
    adminPassword = 'admin',
  }: { username: string; email: string; password: string; adminPassword?: string }
) {
  await page.getByRole('button', { name: 'Add user' }).click();
  const sidepanel = page.locator('aside').filter({ hasText: 'New user' }).first();
  await expect(sidepanel).toBeVisible();
  await sidepanel.locator('#username').fill(username);
  await sidepanel.locator('#email').fill(email);
  await sidepanel.locator('#password').fill(password);
  await sidepanel.getByRole('button', { name: 'Save' }).click();
  await fillConfirmationModalPassword(page, adminPassword);
  await expect(page.locator('table tbody').getByText(username)).toBeVisible();
}

export async function loginThroughForm(page: Page, username: string, password: string) {
  await gotoWithRetry('/login', page);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  const loginResponse = page.waitForResponse(
    response => response.url().includes('/api/login') && response.request().method() === 'POST'
  );
  await page.locator('button[type="submit"]').click();
  return loginResponse;
}
