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
const THESAURUS_NAME = `E2E Thesaurus ${TIMESTAMP}`;
const ITEM_ONE = `First Item ${TIMESTAMP}`;
const ITEM_TWO = `Second Item ${TIMESTAMP}`;
const ITEM_TWO_EDITED = `${ITEM_TWO} edited`;
const GROUP_NAME = `Group A ${TIMESTAMP}`;
const GROUP_CHILD = `Child A ${TIMESTAMP}`;

test('thesauri contract: create, edit, delete and persist items + group', async ({ page }) => {
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

  await test.step('Login and open Thesauri settings', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/settings/thesauri', page);
    await expect(page.getByTestId('settings-thesauri')).toBeVisible();
  });

  await test.step('Open the new thesaurus form and fill the name', async () => {
    await page.getByRole('link', { name: 'Add thesaurus' }).click();
    await expect(page).toHaveURL(/\/settings\/thesauri\/new/);
    await page.locator('#thesauri-name').fill(THESAURUS_NAME);
  });

  await test.step('Add two items via the value sidepanel', async () => {
    await page.getByRole('button', { name: 'Add item' }).first().click();
    const sidepanel = page.locator('form[data-testid="value-thesauri-form"]');
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('input[name="newValues.0.label"]').fill(ITEM_ONE);
    await sidepanel.locator('input[name="newValues.1.label"]').fill(ITEM_TWO);
    await page.getByTestId('thesaurus-form-submit').click();
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });

  await test.step('Add a group with one child item', async () => {
    await page.getByRole('button', { name: 'Add group' }).click();
    const groupForm = page.locator('form#group-thesauri-form');
    await expect(groupForm).toBeVisible();
    await groupForm.locator('#group-name').fill(GROUP_NAME);
    await groupForm.locator('input[name="subRows.0.label"]').fill(GROUP_CHILD);
    await page.getByTestId('thesaurus-form-submit').click();
    await expect(page.locator('tbody tr')).toHaveCount(3);
  });

  let editUrl = '';

  await test.step('Save the thesaurus and capture the edit URL', async () => {
    const saveResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/thesauris') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByRole('button', { name: 'Save' }).first().click();
    await saveResponse;
    await expect(page.getByText('Thesauri added.').first()).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/thesauri\/edit\/[a-f0-9]+/);
    editUrl = page.url();
  });

  await test.step('Reload the edit page and verify items + group persist', async () => {
    await gotoWithRetry(editUrl, page);
    await expect(page.locator('#thesauri-name')).toHaveValue(THESAURUS_NAME);
    await expect(page.locator('tbody').getByText(ITEM_ONE).first()).toBeVisible();
    await expect(page.locator('tbody').getByText(ITEM_TWO).first()).toBeVisible();
    await expect(page.locator('tbody').getByText(GROUP_NAME).first()).toBeVisible();
  });

  await test.step('Edit the second item label and save', async () => {
    const itemRow = page.locator('tbody tr').filter({ hasText: ITEM_TWO }).first();
    await itemRow.getByRole('button', { name: 'Edit' }).click();
    const sidepanel = page.locator('form[data-testid="value-thesauri-form"]');
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('input[name="newValues.0.label"]').fill(ITEM_TWO_EDITED);
    await page.getByTestId('thesaurus-form-submit').click();

    const saveResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/thesauris') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByRole('button', { name: 'Save' }).first().click();
    await saveResponse;
    await expect(page.getByText('Thesauri updated.').first()).toBeVisible();
  });

  await test.step('Reload edit page and verify the edited label persists', async () => {
    await gotoWithRetry(editUrl, page);
    await expect(page.locator('tbody').getByText(ITEM_TWO_EDITED).first()).toBeVisible();
    await expect(page.locator('tbody').getByText(ITEM_TWO, { exact: true })).toHaveCount(0);
  });

  await test.step('Delete the first item and save', async () => {
    const firstItemRow = page.locator('tbody tr').filter({ hasText: ITEM_ONE }).first();
    await firstItemRow.locator('input[type="checkbox"]').check();
    await page.getByTestId('thesauri-remove-button').click();

    const saveResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/thesauris') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByRole('button', { name: 'Save' }).first().click();
    await saveResponse;
    await expect(page.getByText('Thesauri updated.').first()).toBeVisible();
  });

  await test.step('Reload edit page and verify deleted item is gone but the rest persists', async () => {
    await gotoWithRetry(editUrl, page);
    await expect(page.locator('tbody').getByText(ITEM_ONE)).toHaveCount(0);
    await expect(page.locator('tbody').getByText(ITEM_TWO_EDITED).first()).toBeVisible();
    await expect(page.locator('tbody').getByText(GROUP_NAME).first()).toBeVisible();
  });
});
