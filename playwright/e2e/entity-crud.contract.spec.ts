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

test('entity CRUD contract on /entity with blank fixtures', async ({ page }) => {
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

  const createdTitle = `Contract Entity ${Date.now()}`;
  const updatedTitle = `${createdTitle} Updated`;
  console.log('entity-crud: fixtures restored');

  await loginAsAdmin(page);
  console.log('entity-crud: logged in');
  await gotoWithRetry('/library', page);
  console.log('entity-crud: library opened');

  await page.getByRole('button', { name: 'Create entity' }).click();
  const titleField = page.locator('textarea[name="library.sidepanel.metadata.title"]');
  await expect(titleField).toBeVisible();
  await titleField.fill(createdTitle);

  const createResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/entities') &&
      response.request().method() === 'POST' &&
      response.status() === 200
  );
  await page.getByRole('button', { name: 'Save' }).click();
  const createResponse = await createResponsePromise;
  const createPayload = await createResponse.json();
  const sharedId = createPayload.entity?.sharedId;
  expect(sharedId).toBeTruthy();
  console.log('entity-crud: created', sharedId);

  await gotoWithRetry(`/entity/${sharedId}`, page);

  await expect(page).toHaveURL(/\/(en\/)?entity\/[a-z0-9]+/i);
  const createdEntityUrl = page.url().replace('http://localhost:3000', '');

  await page.getByRole('button', { name: 'Edit' }).click();
  const entityTitleField = page.getByRole('tabpanel', { name: 'Info' }).getByRole('textbox').first();
  await expect(entityTitleField).toBeVisible();
  await entityTitleField.fill(updatedTitle);
  console.log('entity-crud: editing title');

  const updateResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/entities') &&
      response.request().method() === 'POST' &&
      response.status() === 200
  );
  await page.locator('button[type="submit"][form="metadataForm"]').click();
  await updateResponsePromise;
  console.log('entity-crud: updated');

  await gotoWithRetry('/library', page);
  const searchInput = page.locator(
    'input[aria-label="Type something in the search box to get some results."]'
  );
  await searchInput.fill(updatedTitle);
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/searchTerm:%27/);
  await gotoWithRetry(createdEntityUrl, page);
  await expect(page.locator('.item-name').first()).toContainText(updatedTitle);
  console.log('entity-crud: update verified');

  const deleteResponse = await page.request.delete(`/api/entities?sharedId=${sharedId}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  expect(deleteResponse.ok()).toBeTruthy();
  console.log('entity-crud: deleted');

  await gotoWithRetry('/library', page);
  await searchInput.fill(updatedTitle);
  await searchInput.press('Enter');
  await expect(page.getByText('shown of 0 entities').first()).toBeVisible();
});
