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

const NEW_TRANSLATION_VALUE = `e2e-translation-${Date.now()}`;

test('languages and translations contract installs Spanish and persists an edit', async ({
  page,
}) => {
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

  await test.step('Login and open Languages settings', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/settings/languages', page);
    await expect(page.getByTestId('settings-languages')).toBeVisible();
  });

  await test.step('Install Spanish through the modal and wait for it to appear in the table', async () => {
    await page.getByRole('button', { name: 'Install Language' }).first().click();
    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();

    const searchInput = modal.locator('#search-multiselect');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Spanish');

    const spanishOption = modal.locator('button', { hasText: 'Spanish (es)' }).first();
    await expect(spanishOption).toBeVisible();
    await spanishOption.click();
    await expect(spanishOption.locator('[data-testid="pill-comp"]')).toContainText('Selected');

    await modal.getByRole('button', { name: /^Install/ }).click();
    await expect(modal).toBeHidden();

    await expect(page.locator('tr', { hasText: 'Spanish' }).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  let editUrl = '';
  let firstTermCaption = '';
  await test.step('Open the User Interface translations and pick the first visible term', async () => {
    await gotoWithRetry('/settings/translations', page);
    await expect(page.getByTestId('settings-translations')).toBeVisible();

    const userInterfaceRow = page.locator('tr', { hasText: 'User Interface' }).first();
    await expect(userInterfaceRow).toBeVisible();
    await userInterfaceRow.getByRole('link', { name: 'Translate' }).click();

    await expect(page.getByTestId('settings-translations-edit')).toBeVisible();
    const firstTable = page.getByTestId('table').first();
    await expect(firstTable).toBeVisible();
    firstTermCaption = (await firstTable.locator('caption').first().textContent())?.trim() || '';
    expect(firstTermCaption.length).toBeGreaterThan(0);
    editUrl = page.url();
  });

  await test.step('Edit the Spanish value of the first term and save', async () => {
    const firstTable = page.getByTestId('table').first();
    const esRow = firstTable.locator('tr').filter({
      has: page.locator('[data-testid="pill-comp"]', { hasText: 'ES' }),
    });
    const esInput = esRow.locator('input[type="text"]').first();
    await expect(esInput).toBeVisible();
    await esInput.fill(NEW_TRANSLATION_VALUE);

    const saveResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/translations') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByRole('button', { name: 'Save' }).click();
    await saveResponsePromise;
    await expect(page.getByText('Translations saved').first()).toBeVisible();
  });

  await test.step('Reload the edit page and confirm the Spanish value persisted in the UI', async () => {
    await gotoWithRetry(editUrl, page);
    await expect(page.getByTestId('settings-translations-edit')).toBeVisible();
    const firstTable = page.getByTestId('table').first();
    await expect(firstTable.locator('caption').first()).toHaveText(firstTermCaption);
    const esRow = firstTable.locator('tr').filter({
      has: page.locator('[data-testid="pill-comp"]', { hasText: 'ES' }),
    });
    await expect(esRow.locator('input[type="text"]').first()).toHaveValue(NEW_TRANSLATION_VALUE);
  });
});
