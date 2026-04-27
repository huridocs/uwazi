import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe.configure({ mode: 'serial' });

async function gotoWithRetry(url: string, page: import('@playwright/test').Page) {
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

test('settings core contract persists collection name', async ({ page }) => {
  execSync('yarn blank-e2e-fixtures', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_NAME: 'uwazi_e2e',
      INDEX_NAME: 'uwazi_e2e',
    },
  });

  const collectionName = `Playwright Core ${Date.now()}`;

  await loginAsAdmin(page);
  await gotoWithRetry('/settings/collection', page);
  await expect(page).toHaveURL(/\/(en\/)?settings\/collection/);

  const collectionInput = page.locator('#collection-name');
  await expect(collectionInput).toBeVisible();
  await collectionInput.fill(collectionName);

  const saveResponse = page.waitForResponse(
    response =>
      response.url().includes('/api/settings') &&
      response.request().method() === 'POST' &&
      response.status() === 200
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await saveResponse;

  await page.reload();
  await expect(page.locator('#collection-name')).toHaveValue(collectionName);
});
