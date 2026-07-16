import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import {
  createUserViaUi,
  fillConfirmationModalPassword,
  gotoWithRetry,
  loginThroughForm,
  openUsersSettings,
  restoreBlankFixtures,
  submitConfirmationExpectingStatus,
} from './helpers/usersSettings';

test.describe.configure({ mode: 'serial' });

const TIMESTAMP = Date.now();
const USERNAME = `e2e_user_${TIMESTAMP}`;
const USERNAME_EDITED = `${USERNAME}_edited`;
const USER_EMAIL = `e2e_user_${TIMESTAMP}@example.com`;
const USER_PASSWORD = 'secret123';
const ADMIN_PASSWORD = 'admin';

const LOCK_USERNAME = `e2e_lock_${TIMESTAMP}`;
const LOCK_EMAIL = `e2e_lock_${TIMESTAMP}@example.com`;
const LOCK_PASSWORD = 'lockpass123';

const RESET_2FA_USERNAME = `e2e_2fa_${TIMESTAMP}`;
const RESET_2FA_EMAIL = `e2e_2fa_${TIMESTAMP}@example.com`;
const RESET_2FA_PASSWORD = 'twofa123';

test('users contract: create, edit, delete and persist a user', async ({ page }) => {
  test.setTimeout(3 * 60 * 1000);

  await test.step('Restore blank fixtures', async () => {
    restoreBlankFixtures();
  });

  await test.step('Login and open Users settings', async () => {
    await loginAsAdmin(page);
    await openUsersSettings(page);
    await expect(page.getByRole('button', { name: 'Add user' })).toBeVisible();
  });

  await test.step('Create a new user via the sidepanel form', async () => {
    await createUserViaUi(page, {
      username: USERNAME,
      email: USER_EMAIL,
      password: USER_PASSWORD,
      adminPassword: ADMIN_PASSWORD,
    });
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

test('users contract: form validations', async ({ page }) => {
  test.setTimeout(2 * 60 * 1000);

  restoreBlankFixtures();
  await loginAsAdmin(page);
  await openUsersSettings(page);

  const seedUsername = `seed_${TIMESTAMP}`;
  const seedEmail = `seed_${TIMESTAMP}@example.com`;

  await createUserViaUi(page, {
    username: seedUsername,
    email: seedEmail,
    password: USER_PASSWORD,
  });

  await page.getByRole('button', { name: 'Add user' }).click();
  const sidepanel = page.locator('aside').filter({ hasText: 'New user' }).first();
  await expect(sidepanel).toBeVisible();

  await test.step('Reject duplicated username and email', async () => {
    await sidepanel.locator('#username').fill(seedUsername);
    await sidepanel.locator('#email').fill(seedEmail);
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await expect(sidepanel.getByText('Duplicated username')).toBeVisible();
    await expect(sidepanel.getByText('Duplicated email')).toBeVisible();
  });

  await test.step('Reject usernames with spaces', async () => {
    await sidepanel.locator('#username').fill('has spaces');
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await expect(sidepanel.getByText('Usernames cannot have spaces')).toBeVisible();
  });

  await test.step('Reject usernames that are too short or too long', async () => {
    await sidepanel.locator('#username').fill('Al');
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await expect(sidepanel.getByText('Username is too short')).toBeVisible();

    await sidepanel
      .locator('#username')
      .fill('LongNameForAUserWhatIsTheAdminThinkingWhenCreatingIt');
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await expect(sidepanel.getByText('Username is too long')).toBeVisible();
  });

  await test.step('Require a valid email', async () => {
    await sidepanel.locator('#username').fill('valid_user');
    await sidepanel.locator('#email').fill('');
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await expect(sidepanel.getByText('A valid email is required')).toBeVisible();
  });
});

test('users contract: wrong confirmation password is rejected', async ({ page }) => {
  test.setTimeout(2 * 60 * 1000);

  restoreBlankFixtures();
  await loginAsAdmin(page);
  await openUsersSettings(page);

  await createUserViaUi(page, {
    username: USERNAME,
    email: USER_EMAIL,
    password: USER_PASSWORD,
  });

  const userRow = page.locator('table tbody tr').filter({ hasText: USERNAME }).first();
  await userRow.getByRole('button', { name: 'Edit' }).click();
  const sidepanel = page.locator('aside').filter({ hasText: 'Edit user' }).first();
  await expect(sidepanel).toBeVisible();
  await sidepanel.locator('#username').fill(USERNAME_EDITED);
  await sidepanel.getByRole('button', { name: 'Save' }).click();

  await submitConfirmationExpectingStatus(page, 'wrong-password', '/api/users', [401, 403]);
  await expect(sidepanel).toBeVisible();
  await expect(page.locator('table tbody').getByText(USERNAME, { exact: true })).toBeVisible();
});

test('users contract: reset 2FA for a user', async ({ page }) => {
  test.setTimeout(3 * 60 * 1000);

  restoreBlankFixtures();
  await loginAsAdmin(page);
  await openUsersSettings(page);

  await createUserViaUi(page, {
    username: RESET_2FA_USERNAME,
    email: RESET_2FA_EMAIL,
    password: RESET_2FA_PASSWORD,
  });

  const userRow = page.locator('table tbody tr').filter({ hasText: RESET_2FA_USERNAME }).first();
  await userRow.getByRole('button', { name: 'Edit' }).click();
  const sidepanel = page.locator('aside').filter({ hasText: 'Edit user' }).first();
  await expect(sidepanel).toBeVisible();

  await sidepanel.getByRole('button', { name: 'Reset 2FA' }).click();

  const resetResponse = page.waitForResponse(
    response =>
      response.url().includes('/api/auth2fa-reset') &&
      response.request().method() === 'POST' &&
      response.status() < 400
  );
  const modal = page.getByTestId('modal');
  await expect(modal).toBeVisible();
  await modal.locator('#confirm-password').fill(ADMIN_PASSWORD);
  await modal.getByTestId('accept-button').click();
  await resetResponse;

  await expect(page.getByText('Disabled 2FA').first()).toBeVisible();
});

test('users contract: unlock account after failed logins', async ({ page, context }) => {
  test.setTimeout(4 * 60 * 1000);

  restoreBlankFixtures();
  await loginAsAdmin(page);
  await openUsersSettings(page);

  await createUserViaUi(page, {
    username: LOCK_USERNAME,
    email: LOCK_EMAIL,
    password: LOCK_PASSWORD,
  });

  await test.step('Lock the account with repeated failed logins', async () => {
    await context.clearCookies();
    await Array.from({ length: 6 }).reduce(async previous => {
      await previous;
      const response = await loginThroughForm(page, LOCK_USERNAME, 'wrong-password');
      expect((await response).status()).toBeGreaterThanOrEqual(400);
    }, Promise.resolve());
  });

  await test.step('Unlock the account as admin', async () => {
    await loginAsAdmin(page);
    await openUsersSettings(page);

    const userRow = page.locator('table tbody tr').filter({ hasText: LOCK_USERNAME }).first();
    await userRow.getByRole('button', { name: 'Edit' }).click();
    const sidepanel = page.locator('aside').filter({ hasText: 'Edit user' }).first();
    await expect(sidepanel).toBeVisible();
    await expect(sidepanel.getByRole('button', { name: 'Unlock account' })).toBeVisible();

    await sidepanel.getByRole('button', { name: 'Unlock account' }).click();

    const unlockResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/users/unlock') &&
        response.request().method() === 'POST' &&
        response.status() < 400
    );
    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();
    await modal.locator('#confirm-password').fill(ADMIN_PASSWORD);
    await modal.getByTestId('accept-button').click();
    await unlockResponse;
    await expect(page.getByText('Account unlocked successfully').first()).toBeVisible();
  });

  await test.step('Login with the unlocked user', async () => {
    await context.clearCookies();
    const loginResponse = await loginThroughForm(page, LOCK_USERNAME, LOCK_PASSWORD);
    expect((await loginResponse).ok()).toBeTruthy();
    await gotoWithRetry('/settings/account', page);
    await expect(page.locator('#account-username')).toHaveValue(LOCK_USERNAME);
  });
});
