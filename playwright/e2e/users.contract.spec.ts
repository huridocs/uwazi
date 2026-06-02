import { execSync } from 'child_process';
import { expect, Page, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe.configure({ mode: 'serial' });

async function gotoWithRetry(url: string, page: Page) {
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

const TIMESTAMP = Date.now();
const USERNAME = `e2e_user_${TIMESTAMP}`;
const USERNAME_EDITED = `${USERNAME}_edited`;
const USER_EMAIL = `e2e_user_${TIMESTAMP}@example.com`;
const USER_PASSWORD = 'secret123';
const ADMIN_PASSWORD = 'admin';

async function fillConfirmationModalPassword(page: Page, password: string) {
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

test('users contract: create, edit, delete and persist a user', async ({ page }) => {
  test.setTimeout(3 * 60 * 1000);

  await test.step('Restore blank fixtures', async () => {
    execSync('yarn blank-e2e-fixtures', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_NAME: 'uwazi_e2e',
        INDEX_NAME: 'uwazi_e2e',
      },
    });
  });

  await test.step('Login and open Users settings', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/settings/users', page);
    await expect(page.getByRole('button', { name: 'Add user' })).toBeVisible();
  });

  await test.step('Create a new user via the sidepanel form', async () => {
    await page.getByRole('button', { name: 'Add user' }).click();
    const sidepanel = page.locator('aside').filter({ hasText: 'New user' }).first();
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('#username').fill(USERNAME);
    await sidepanel.locator('#email').fill(USER_EMAIL);
    await sidepanel.locator('#password').fill(USER_PASSWORD);
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await fillConfirmationModalPassword(page, ADMIN_PASSWORD);
    await expect(page.locator('table tbody').getByText(USERNAME)).toBeVisible();
  });

  await test.step('Edit the new user and update the username', async () => {
    const userRow = page.locator('table tbody tr').filter({ hasText: USERNAME }).first();
    await userRow.getByRole('button', { name: 'Edit' }).click();
    const sidepanel = page.locator('aside').filter({ hasText: 'Edit user' }).first();
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('#username').fill(USERNAME_EDITED);
    await sidepanel.locator('#password').fill(USER_PASSWORD);
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await fillConfirmationModalPassword(page, ADMIN_PASSWORD);
    await expect(page.locator('table tbody').getByText(USERNAME_EDITED)).toBeVisible();
  });

  await test.step('Reload the users page and verify the rename persists', async () => {
    await gotoWithRetry('/settings/users', page);
    await expect(page.locator('table tbody').getByText(USERNAME_EDITED)).toBeVisible();
    await expect(page.locator('table tbody').getByText(USERNAME, { exact: true })).toHaveCount(0);
  });

  await test.step('Delete the user via bulk delete with admin password', async () => {
    const userRow = page.locator('table tbody tr').filter({ hasText: USERNAME_EDITED }).first();
    await userRow.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Delete' }).first().click();
    await fillConfirmationModalPassword(page, ADMIN_PASSWORD);
  });

  await test.step('Reload and verify the deleted user no longer appears', async () => {
    await gotoWithRetry('/settings/users', page);
    await expect(page.locator('table tbody').getByText(USERNAME_EDITED)).toHaveCount(0);
  });
});
