import { expect, Page, test } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { loginAsAdmin } from './helpers/auth';

test.describe.configure({ mode: 'serial' });

type EntityRow = {
  _id: string;
  name?: string;
  label?: string;
  properties?: Array<{ name: string; label: string; type: string }>;
};

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

async function waitForSuggestionsStatusReady(page: Page, extractorId: string, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const statusResponse = await page.request.post('/api/suggestions/status', {
      data: { extractorId },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    expect(statusResponse.ok()).toBeTruthy();
    const statusPayload = await statusResponse.json();
    if (statusPayload.status === 'ready') return;
    await page.waitForTimeout(1500);
  }

  throw new Error(`Suggestions never reached ready state for extractor ${extractorId}`);
}

async function waitForMongoSegmentationsReady(timeoutMs = 60_000) {
  const dbHost = process.env.DBHOST || '127.0.0.1:27017';
  const databaseName = process.env.DATABASE_NAME || 'uwazi_e2e';
  const client = new MongoClient(`mongodb://${dbHost}`);
  try {
    await client.connect();
    const collection = client.db(databaseName).collection('segmentations');
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const count = await collection.countDocuments({ status: 'ready' });
      if (count > 0) return count;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    throw new Error(
      `Timed out after ${timeoutMs}ms waiting for Mongo segmentations with status ready (check segmentation service / EXTERNAL_SERVICES / dummy).`
    );
  } finally {
    await client.close();
  }
}

test('ix lifecycle contract from UI', async ({ page }) => {
  test.setTimeout(6 * 60 * 1000);

  await test.step('Login as admin', async () => {
    await loginAsAdmin(page);
  });
  const extractorName = `IX Heroes BIO ${Date.now()}`;

  const templatesResponse = await page.request.get('/api/templates');
  expect(templatesResponse.ok()).toBeTruthy();
  const templatesPayload = await templatesResponse.json();
  const templates = (Array.isArray(templatesPayload) ? templatesPayload : templatesPayload.rows) as EntityRow[];
  const heroesTemplate = templates.find(
    (t: any) => `${t?.name || ''}`.toLowerCase() === 'heroes' || `${t?.label || ''}`.toLowerCase() === 'heroes'
  );
  expect(heroesTemplate?._id).toBeTruthy();
  const bioProperty = (heroesTemplate?.properties || []).find(
    (p: any) =>
      `${p?.label || ''}`.toLowerCase() === 'bio' ||
      `${p?.name || ''}`.toLowerCase() === 'bio' ||
      `${p?.label || ''}`.toLowerCase().includes('bio')
  );
  expect(bioProperty?.name).toBeTruthy();
  const bioPropertyLabel = bioProperty?.label || 'Bio';

  await test.step('Create metadata extractor from UI', async () => {
    await gotoWithRetry('/settings/metadata_extraction', page);
    await page.getByRole('button', { name: 'Create Extractor' }).click();
    const createModal = page.getByTestId('modal');
    await expect(createModal).toBeVisible();
    await createModal.locator('#extractor-name').fill(extractorName);
    const heroesItem = createModal.locator('li', { hasText: /Heroes/i }).first();
    await expect(heroesItem).toBeVisible();
    if (await heroesItem.getByRole('button', { name: 'Group' }).isVisible().catch(() => false)) {
      await heroesItem.getByRole('button', { name: 'Group' }).click();
    }
    await heroesItem.getByText(new RegExp(`${bioPropertyLabel}`, 'i')).click();
    await createModal.getByRole('button', { name: 'Next' }).click();
    await createModal.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(2000);
  });

  await test.step('Select training entities and wait for segmentations', async () => {
    await expect(page.getByRole('cell', { name: extractorName })).toBeVisible({ timeout: 30000 });
    const createdRow = page.getByRole('row', { name: new RegExp(extractorName) });
    await createdRow.getByRole('button', { name: 'Review' }).click();
    const trainingButtons = page.getByTestId('ix-training-set-add');
    await expect(trainingButtons.first()).toBeVisible({ timeout: 60_000 });
    const trainingCount = await trainingButtons.count();
    expect(trainingCount).toBeGreaterThan(1);
    await trainingButtons.nth(0).click();
    await trainingButtons.nth(1).click();
    const readySegmentations = await waitForMongoSegmentationsReady();
    expect(readySegmentations).toBeGreaterThan(0);
  });

  await test.step('Train model and wait for ready status', async () => {
    await expect(page.getByRole('button', { name: 'Train model' })).toBeVisible();
    await page.getByRole('button', { name: 'Train model' }).click();
    const trainModal = page.getByTestId('modal');
    await expect(trainModal).toBeVisible();
    const findAfterTrainingLabel = trainModal.getByText('Find suggestions after training');
    await expect(findAfterTrainingLabel).toBeVisible();
    await findAfterTrainingLabel.click();
    if (
      await trainModal
        .locator('label[for="find.samplePolicy_marked_plus_labeled"]')
        .isVisible()
        .catch(() => false)
    ) {
      await trainModal.locator('label[for="find.samplePolicy_marked_plus_labeled"]').click();
    }
    await trainModal.getByRole('button', { name: /^Train$/ }).click();

    const extractorResponse = await page.request.get('/api/ixextractors');
    expect(extractorResponse.ok()).toBeTruthy();
    const extractorPayload = await extractorResponse.json();
    const extractors = Array.isArray(extractorPayload) ? extractorPayload : extractorPayload.rows;
    const createdExtractor = extractors.find((item: any) => item.name === extractorName);
    expect(createdExtractor?._id).toBeTruthy();
    await waitForSuggestionsStatusReady(page, createdExtractor._id, 60_000);
    const openModal = page.getByTestId('modal');
    if (await openModal.isVisible().catch(() => false)) {
      const closeButton = openModal.getByRole('button', { name: /Close|Cancel|Done/i });
      if (await closeButton.first().isVisible().catch(() => false)) {
        await closeButton.first().click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  await expect
    .poll(async () => await page.locator('tbody tr button[data-testid="ix-accept-suggestion"]:not([disabled])').count(), {
      timeout: 60_000,
      intervals: [500, 1000, 1500],
      message: 'Wait for at least one enabled Accept suggestion button',
    })
    .toBeGreaterThan(0);

  const acceptButton = page.locator('tbody tr button[data-testid="ix-accept-suggestion"]:not([disabled])').first();
  const targetRow = acceptButton.locator('xpath=ancestor::tr[1]');
  await expect(targetRow).toBeVisible();

  const openButtonBeforeAccept = targetRow.getByRole('button', { name: 'Open' }).first();
  await expect(openButtonBeforeAccept).toBeVisible();
  await openButtonBeforeAccept.click();
  await expect(page.getByTestId('ix-pdf-sidepanel')).toBeVisible({ timeout: 30000 });
  const sidepanelInput = page.locator('aside input[name="field"]').first();
  await expect(sidepanelInput).toBeVisible();
  const valueBeforeAccept = (await sidepanelInput.inputValue()).trim();
  const closeSidepanelButton = page.locator('aside').getByRole('button', { name: /Cancel|Close/i }).first();
  if (await closeSidepanelButton.isVisible().catch(() => false)) {
    await closeSidepanelButton.click();
  } else {
    await page.keyboard.press('Escape');
  }

  await expect(acceptButton).toBeVisible();
  const acceptResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/suggestions/accept') &&
      response.request().method() === 'POST' &&
      response.status() >= 200 &&
      response.status() < 300
  );
  await acceptButton.click();
  await acceptResponsePromise;
  //wait for suggestions updated message
  await expect(page.getByTestId('notification-flash-title').filter({ hasText: /^Suggestions updated$/i })).toBeVisible({
    timeout: 30000,
  });

  const openButtonAfterAccept = targetRow.getByRole('button', { name: 'Open' }).first();
  await expect(openButtonAfterAccept).toBeVisible();
  await openButtonAfterAccept.click();
  await expect(page.getByTestId('ix-pdf-sidepanel')).toBeVisible({ timeout: 30000 });
  const sidepanelInputAfterAccept = page.locator('aside input[name="field"]').first();
  await expect(sidepanelInputAfterAccept).toBeVisible();
  const valueAfterAccept = (await sidepanelInputAfterAccept.inputValue()).trim();
  expect(valueAfterAccept.length > 0 || valueBeforeAccept.length > 0).toBeTruthy();
 
});
