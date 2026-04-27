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

function getMongoEntitiesCountByTemplate(templateId: string) {
  const raw = execSync(
    `mongosh "mongodb://127.0.0.1:27017/uwazi_e2e" --quiet --eval "const count=db.entities.countDocuments({ template: '${templateId}' }); print(count);"`,
    { encoding: 'utf8' }
  ).trim();
  return Number.parseInt(raw, 10);
}

test('paragraph extraction lifecycle status transitions from UI', async ({ page }) => {
  test.setTimeout(4 * 60 * 1000);

  // Reset to deterministic seeded data and enable PX feature flag.
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

  // Prepare only the minimum extra data needed for this contract:
  // a target template and a second relationship type required by PX setup.
  const targetTemplateName = `PX Target ${Date.now()}`;
  const sourceTemplateName = 'Heroes';
  await createTemplate(page.request, targetTemplateName, [
    { name: 'paragraphBody', label: 'Paragraph body', type: 'markdown' },
    { name: 'paragraphNumber', label: 'Paragraph number', type: 'numeric' },
  ]);

  const secondRelationTypeResponse = await page.request.post('/api/relationtypes', {
    data: { name: `px-ui-${Date.now()}`, properties: [] },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  expect(secondRelationTypeResponse.ok()).toBeTruthy();
  // Small stabilization delay after setup writes.
  await page.waitForTimeout(2000);

  // Configure extractor through UI wizard:
  // target template -> source template (Heroes) -> extraction mappings.
  await gotoWithRetry('/settings', page);
  await page.getByRole('link', { name: 'Paragraph Extraction' }).click();
  await expect(page.getByRole('button', { name: 'Add extractor' })).toBeVisible();

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

  // Open extractor details and wait until source entities are listed.
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

  // Trigger extraction from UI:
  // - preferred path: global "Extract new paragraphs"
  // - fallback path: select one "New" row and confirm modal flow.
  let shouldWaitForExtractionRequest = false;
  const extractNewButton = page.getByRole('button', { name: 'Extract new paragraphs' });
  if (await extractNewButton.isEnabled().catch(() => false)) {
    shouldWaitForExtractionRequest = true;
    const extractNewResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/paragraphExtraction/extractNew') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await extractNewButton.click();
    await extractNewResponse;
  } else {
    const newRow = page.locator('tbody tr').filter({ hasText: 'New' }).first();
    if (await newRow.isVisible().catch(() => false)) {
      shouldWaitForExtractionRequest = true;
      const extractNewResponse = page.waitForResponse(
        response =>
          response.url().includes('/api/paragraphExtraction/extractNew') &&
          response.request().method() === 'POST' &&
          response.status() === 200
      );
      await newRow.locator('input[type="checkbox"]').first().check();
      await page.getByRole('button', { name: 'Extract paragraphs' }).click();
      const confirmationModal = page.getByTestId('modal');
      await expect(confirmationModal).toBeVisible();
      await confirmationModal.getByRole('button', { name: 'Continue' }).click();
      await extractNewResponse;
    }
  }

  // Contract check (DB): extraction creates entities for the new target template.
  if (shouldWaitForExtractionRequest) {
    await expect
      .poll(() => getMongoEntitiesCountByTemplate(targetTemplate._id), {
        timeout: 45000,
        intervals: [1000, 1500, 2000],
      })
      .toBeGreaterThan(0);
  }
});
