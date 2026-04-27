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

test('csv import lifecycle contract from UI', async ({ page }) => {
  test.setTimeout(3 * 60 * 1000);

  execSync('yarn blank-e2e-fixtures', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_NAME: 'uwazi_e2e',
      INDEX_NAME: 'uwazi_e2e',
    },
  });

  await page.addInitScript(() => {
    const featureFlags = (window as typeof window & { __featureFlags__?: Record<string, boolean> })
      .__featureFlags__;
    (window as typeof window & { __featureFlags__?: Record<string, boolean> }).__featureFlags__ = {
      ...(featureFlags || {}),
      v2CSVImport: true,
    };
  });
  await loginAsAdmin(page);
  await gotoWithRetry('/settings/csv', page);
  await expect(page.getByText('Import CSV or ZIP files to create entities in bulk.')).toBeVisible();

  const importedTitles = [
    `CSV Contract ${Date.now()}`,
    `CSV Contract ${Date.now() + 1}`,
    `CSV Contract ${Date.now() + 2}`,
  ];
  const csvContent = `title\n${importedTitles.join('\n')}\n`;
  await page.getByRole('button', { name: 'Import CSV' }).click();
  const modal = page.getByTestId('modal');
  await expect(modal).toBeVisible();

  await expect(modal.getByRole('combobox', { name: 'Template' })).toBeVisible();
  await modal.locator('input[type="file"]').setInputFiles({
    name: 'contract-import.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent, 'utf8'),
  });

  await expect(modal.getByText('contract-import.csv')).toBeVisible();
  const importResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/csvImportEntities') &&
      response.request().method() === 'POST' &&
      response.status() === 200
  );
  await modal.getByRole('button', { name: 'Accept' }).click();
  await importResponsePromise;

  const terminalStatuses = ['Done creating entities', 'Import process failed', 'Cancelled'];
  let matchedStatus: string | undefined;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    for (const status of terminalStatuses) {
      if (await page.getByRole('cell', { name: status }).first().isVisible().catch(() => false)) {
        matchedStatus = status;
        break;
      }
    }
    if (matchedStatus) {
      break;
    }
    await page.waitForTimeout(1000);
  }

  expect(matchedStatus).toBe('Done creating entities');
  await expect(page.getByRole('cell', { name: 'View' }).first()).toBeVisible();
  await gotoWithRetry(
    "/library/?q=(allAggregations:!f,includeUnpublished:!t,order:desc,sort:creationDate,treatAs:number,unpublished:!f)",
    page
  );
  const searchInput = page.locator(
    'input[aria-label="Type something in the search box to get some results."]'
  );
  await expect(searchInput).toBeVisible();

  for (const title of importedTitles) {
    let found = false;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await searchInput.fill(title);
      const searchResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/search') &&
          response.request().method() === 'GET' &&
          response.status() === 200
      );
      await searchInput.press('Enter');
      const searchResponse = await searchResponsePromise;
      const searchPayload = await searchResponse.json();
      if ((searchPayload.totalRows || 0) > 0) {
        found = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    expect(found, `Expected imported entity with title "${title}" to be searchable in library`).toBeTruthy();
  }
});
