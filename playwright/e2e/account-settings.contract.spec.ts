import { execSync } from 'child_process';
import { expect, Page, test } from '@playwright/test';
import { authenticator } from 'otplib';
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

async function loginThroughForm(page: Page, username: string, password: string) {
  await gotoWithRetry('/login', page);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  const loginResponse = page.waitForResponse(
    response => response.url().includes('/api/login') && response.request().method() === 'POST'
  );
  await page.locator('button[type="submit"]').click();
  await loginResponse;
}

const ADMIN_USERNAME = 'admin';
const ORIGINAL_PASSWORD = 'admin';
const NEW_PASSWORD = 'e2e-pass-1234';
const ADMIN_EMAIL = 'admin@uwazi.io';

test('account contract: password update, re-login, 2FA enable and TOTP login', async ({
  page,
  context,
}) => {
  test.setTimeout(5 * 60 * 1000);

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

  await test.step('Login as admin and open Account settings', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/settings/account', page);
    await expect(page.getByTestId('settings-account')).toBeVisible();
  });

  await test.step('Validate inline error when password and confirmation do not match', async () => {
    await page.locator('#account-email').fill(ADMIN_EMAIL);
    await page.locator('#new-password').fill(NEW_PASSWORD);
    await page.locator('#confirm-new-password').fill(`${NEW_PASSWORD}_no_match`);
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Passwords do not match').first()).toBeVisible();
  });

  await test.step('Fix the confirmation, submit and confirm the update with the current password', async () => {
    await page.locator('#confirm-new-password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Update' }).click();

    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();
    await modal.locator('#confirm-password').fill(ORIGINAL_PASSWORD);

    const updateResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/users') &&
        response.request().method() === 'POST' &&
        response.status() < 400
    );
    await modal.getByTestId('accept-button').click();
    await updateResponse;
    await expect(modal).toBeHidden();
    await expect(page.getByText('Account updated').first()).toBeVisible();
  });

  await test.step('Logout from the account footer link', async () => {
    await page.locator('[data-testid="account-logout"]').click();
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });

  await test.step('Login again with the new password and reach Account settings', async () => {
    await loginThroughForm(page, ADMIN_USERNAME, NEW_PASSWORD);
    await gotoWithRetry('/settings/account', page);
    await expect(page.getByTestId('settings-account')).toBeVisible();
  });

  let totpSecret = '';

  await test.step('Open the 2FA setup sidepanel and read the secret from the UI', async () => {
    await page.getByRole('button', { name: 'Enable' }).first().click();
    const secretInput = page.locator('#authenticator-secret');
    await expect(secretInput).toBeVisible();
    await expect(secretInput).not.toHaveValue('');
    totpSecret = await secretInput.inputValue();
    expect(totpSecret.length).toBeGreaterThan(0);
  });

  await test.step('Generate a TOTP token, enable 2FA and verify the activated state', async () => {
    const token = authenticator.generate(totpSecret);
    await page.locator('#authenticator-token').fill(token);

    const enableResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/auth2fa-enable') &&
        response.request().method() === 'POST' &&
        response.status() < 400
    );
    await page.locator('aside').getByRole('button', { name: 'Enable' }).click();
    await enableResponse;

    await expect(page.getByText('Activated').first()).toBeVisible();
  });

  await test.step('Logout to reset the session before testing 2FA login', async () => {
    await context.clearCookies();
    await gotoWithRetry('/login', page);
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });

  await test.step('Login with username + password and provide a fresh TOTP token to authenticate', async () => {
    await page.locator('input[name="username"]').fill(ADMIN_USERNAME);
    await page.locator('input[name="password"]').fill(NEW_PASSWORD);
    await page.locator('button[type="submit"]').click();

    const tokenInput = page.locator('input[name="token"]');
    await expect(tokenInput).toBeVisible({ timeout: 30_000 });

    const loginToken = authenticator.generate(totpSecret);
    await tokenInput.fill(loginToken);

    const loginResponse = page.waitForResponse(
      response => response.url().includes('/api/login') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Verify' }).click();
    await loginResponse;
  });

  await test.step('Confirm the 2FA-protected session can reach Account settings again', async () => {
    await gotoWithRetry('/settings/account', page);
    await expect(page.getByTestId('settings-account')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Activated').first()).toBeVisible();
  });
});
