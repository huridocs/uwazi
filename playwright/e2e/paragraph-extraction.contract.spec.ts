import { execSync } from 'child_process';
import { expect, Page, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { createTemplate } from './helpers/setupData';

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

test('paragraph extraction lifecycle', async ({ page }) => {
  test.setTimeout(4 * 60 * 1000);

  await test.step('Restore seeded fixtures and login', async () => {
    execSync('yarn e2e-fixtures', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_NAME: 'uwazi_e2e',
        INDEX_NAME: 'uwazi_e2e',
        FEATURE_FLAG_PARAGRAPH_EXTRACTION: 'true',
      },
    });
    await page.addInitScript(() => {
      (window as typeof window & { __featureFlags__?: { paragraphExtraction: boolean } }).__featureFlags__ = {
        paragraphExtraction: true,
      };
    });
    await loginAsAdmin(page);
  });

  const targetTemplateName = `PX Target ${Date.now()}`;
  const sourceTemplateName = 'Heroes';
  await test.step('Create prerequisites and open PX settings', async () => {
    const createdTemplate = await createTemplate(page.request, targetTemplateName, [
      { name: 'paragraphBody', label: 'Paragraph body', type: 'markdown' },
      { name: 'paragraphNumber', label: 'Paragraph number', type: 'numeric' },
    ]);
    const secondRelationTypeResponse = await page.request.post('/api/relationtypes', {
      data: { name: `px-ui-${Date.now()}`, properties: [] },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    expect(secondRelationTypeResponse.ok()).toBeTruthy();
    await page.waitForTimeout(2000);
    await gotoWithRetry('/settings', page);
    await page.getByRole('link', { name: 'Paragraph Extraction' }).click();
    await expect(page.getByRole('button', { name: 'Add extractor' })).toBeVisible();
  });

  await test.step('Create paragraph extractor from UI wizard', async () => {
    await page.getByRole('button', { name: 'Add extractor' }).click();
    await expect(page.getByRole('heading', { name: 'Target template' })).toBeVisible();
    const targetModal = page.getByRole('dialog', { name: 'Modal' });
    await targetModal.getByRole('textbox', { name: 'search-multiselect' }).fill(targetTemplateName);
    await targetModal.getByRole('button', { name: 'Select' }).first().click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Source template' })).toBeVisible();
    const sourceModal = page.getByRole('dialog', { name: 'Modal' });
    await sourceModal.getByRole('textbox', { name: 'search-multiselect' }).fill(sourceTemplateName);
    await sourceModal.getByRole('button', { name: 'Select' }).filter({ hasText: sourceTemplateName }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Extraction configuration' })).toBeVisible();
    const selects = page.locator('select');
    await selects.nth(0).selectOption({ index: 1 });
    await selects.nth(1).selectOption({ index: 1 });
    await selects.nth(2).selectOption({ index: 1 });
    await selects.nth(3).selectOption({ index: 1 });
  });

  const createExtractorResponse = page.waitForResponse(
    response =>
      response.url().includes('/api/paragraphExtraction/extractor') &&
      response.request().method() === 'POST' &&
      response.status() === 200
  );
  await page.getByRole('button', { name: 'Create' }).click();
  const createExtractorResult = await createExtractorResponse;
  const createExtractorPayload = await createExtractorResult.json();
  const extractorId = createExtractorPayload.extractorId;
  expect(extractorId).toBeTruthy();
  await expect(page.getByTestId('notification-flash-title').getByText('Paragraph Extractor added')).toBeVisible();

  await test.step('Open extractor details and wait for source rows', async () => {
    await page.getByRole('button', { name: 'View' }).first().click();
    await expect(page.getByText('Paragraphs').first()).toBeVisible();
    let hasEntityRows = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const rowCount = await page.locator('tbody tr').count();
      if (rowCount > 0) {
        hasEntityRows = true;
        break;
      }
      await page.waitForTimeout(1000);
    }
    expect(hasEntityRows).toBeTruthy();
  });

  await test.step('Trigger paragraph extraction', async () => {
    const extractNewButton = page.getByRole('button', { name: 'Extract new paragraphs' });
    const extractNewResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/paragraphExtraction/extractNew') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await extractNewButton.click();
    await extractNewResponse;
  });

  await test.step('Wait until extractor rows show ready status', async () => {
    await expect
      .poll(async () => page.locator('tbody tr span.sr-only', { hasText: /Processed/i }).count(), {
        timeout: 90000,
        intervals: [1000, 1500, 2000],
      })
      .toBeGreaterThan(0);
  });

  await test.step('Open one ready entity and validate extracted paragraphs table', async () => {
    const processedRow = page
      .locator('tbody tr')
      .filter({ has: page.locator('span.sr-only', { hasText: /Processed/i }) })
      .first();
    await expect(processedRow).toBeVisible();
    await processedRow.getByRole('button', { name: 'View' }).click();
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });
  });
});
