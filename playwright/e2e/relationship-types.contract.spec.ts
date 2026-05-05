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
const PARENT_NAME = `Parent ${TIMESTAMP}`;
const SON_NAME = `Son ${TIMESTAMP}`;
const PARENT_EDITED = `${PARENT_NAME} edited`;

test('relationship types contract: create, edit, delete and persist', async ({ page }) => {
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

  await test.step('Login and open Relationship types settings', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/settings/relationship-types', page);
    await expect(page.getByTestId('relationship-types-add')).toBeVisible();
  });

  await test.step('Create the Parent relationship type', async () => {
    await page.getByTestId('relationship-types-add').click();
    const sidepanel = page.locator('aside').filter({ hasText: 'Relationship Type' }).first();
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('#relationship-type-name').fill(PARENT_NAME);

    const saveResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/relationtypes') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByTestId('relationship-type-form-submit').click();
    await saveResponse;
  });

  await test.step('Create the Son relationship type', async () => {
    await expect(page.getByRole('cell', { name: PARENT_NAME, exact: false })).toBeVisible();
    await page.getByTestId('relationship-types-add').click();
    const sidepanel = page.locator('aside').filter({ hasText: 'Relationship Type' }).first();
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('#relationship-type-name').fill(SON_NAME);

    const saveResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/relationtypes') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByTestId('relationship-type-form-submit').click();
    await saveResponse;

    await expect(page.getByRole('cell', { name: SON_NAME, exact: false })).toBeVisible();
  });

  await test.step('Edit the Parent relationship type', async () => {
    const parentRow = page.locator('tbody tr').filter({ hasText: PARENT_NAME }).first();
    await expect(parentRow).toBeVisible();
    await parentRow.getByRole('button', { name: 'Edit' }).click();

    const sidepanel = page.locator('aside').filter({ hasText: 'Relationship Type' }).first();
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('#relationship-type-name').fill(PARENT_EDITED);

    const saveResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/relationtypes') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByTestId('relationship-type-form-submit').click();
    await saveResponse;
  });

  await test.step('Reload settings and verify both relationship types persist', async () => {
    await gotoWithRetry('/settings/relationship-types', page);
    await expect(page.getByRole('cell', { name: PARENT_EDITED, exact: false })).toBeVisible();
    await expect(page.getByRole('cell', { name: SON_NAME, exact: false })).toBeVisible();
  });

  await test.step('Delete the Parent relationship type', async () => {
    const parentRow = page.locator('tbody tr').filter({ hasText: PARENT_EDITED }).first();
    await parentRow.locator('input[type="checkbox"]').check();

    await page.getByTestId('relationship-types-delete').click();
    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();

    const deleteResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/relationtypes') &&
        ['DELETE', 'POST'].includes(response.request().method()) &&
        response.status() < 400
    );
    await modal.getByTestId('accept-button').click();
    await deleteResponse;
  });

  await test.step('Reload and verify only the Son relationship type persists', async () => {
    await gotoWithRetry('/settings/relationship-types', page);
    await expect(page.getByRole('cell', { name: SON_NAME, exact: false })).toBeVisible();
    await expect(page.getByText(PARENT_EDITED)).toHaveCount(0);
  });
});
