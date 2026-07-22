import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { gotoWithRetry, openUsersSettings, restoreBlankFixtures } from './helpers/usersSettings';

test.describe.configure({ mode: 'serial' });

const TIMESTAMP = Date.now();
const GROUP_NAME = `E2E Group ${TIMESTAMP}`;
const GROUP_NAME_EDITED = `${GROUP_NAME} edited`;

test('groups contract: create, edit, delete and persist a group', async ({ page }) => {
  test.setTimeout(4 * 60 * 1000);

  await test.step('Restore blank fixtures', async () => {
    restoreBlankFixtures();
  });

  await test.step('Login and open Groups tab', async () => {
    await loginAsAdmin(page);
    await openUsersSettings(page);
    await page.getByRole('tab', { name: 'Groups' }).click();
    await expect(page.getByRole('button', { name: 'Add group' })).toBeVisible();
  });

  await test.step('Create a new group', async () => {
    await page.getByRole('button', { name: 'Add group' }).click();
    const sidepanel = page.locator('aside').filter({ hasText: 'New group' }).first();
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('#name').fill(GROUP_NAME);

    const saveResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/usergroups') &&
        response.request().method() === 'POST' &&
        response.status() < 400
    );
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await saveResponse;

    await expect(page.locator('table tbody').getByText(GROUP_NAME)).toBeVisible();
  });

  await test.step('Edit the group name', async () => {
    const groupRow = page.locator('table tbody tr').filter({ hasText: GROUP_NAME }).first();
    await groupRow.getByRole('button', { name: 'Edit' }).click();
    const sidepanel = page.locator('aside').filter({ hasText: 'Edit group' }).first();
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('#name').fill(GROUP_NAME_EDITED);

    const saveResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/usergroups') &&
        response.request().method() === 'POST' &&
        response.status() < 400
    );
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await saveResponse;

    await expect(page.locator('table tbody').getByText(GROUP_NAME_EDITED)).toBeVisible();
  });

  await test.step('Reload and verify the rename persists', async () => {
    await gotoWithRetry('/settings/users', page);
    await page.getByRole('tab', { name: 'Groups' }).click();
    await expect(page.locator('table tbody').getByText(GROUP_NAME_EDITED)).toBeVisible();
    await expect(page.locator('table tbody').getByText(GROUP_NAME, { exact: true })).toHaveCount(0);
  });

  await test.step('Reject duplicated group names', async () => {
    await page.getByRole('button', { name: 'Add group' }).click();
    const sidepanel = page.locator('aside').filter({ hasText: 'New group' }).first();
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('#name').fill(GROUP_NAME_EDITED);
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await expect(sidepanel.getByText('Duplicated name')).toBeVisible();
    await sidepanel.getByRole('button', { name: 'Cancel' }).click();
  });

  await test.step('Delete the group and verify it is gone after reload', async () => {
    const groupRow = page.locator('table tbody tr').filter({ hasText: GROUP_NAME_EDITED }).first();
    await groupRow.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Delete' }).first().click();

    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(GROUP_NAME_EDITED)).toBeVisible();

    const deleteResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/usergroups') &&
        response.request().method() === 'DELETE' &&
        response.status() < 400
    );
    await modal.getByTestId('accept-button').click();
    await deleteResponse;

    await gotoWithRetry('/settings/users', page);
    await page.getByRole('tab', { name: 'Groups' }).click();
    await expect(page.locator('table tbody').getByText(GROUP_NAME_EDITED)).toHaveCount(0);
  });
});
