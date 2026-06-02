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

  const createdTitle = `Contract Entity ${Date.now()}`;
  const updatedTitle = `${createdTitle} Updated`;
  await test.step('Login and open library', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/library', page);
  });

  const createResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/entities') &&
      response.request().method() === 'POST' &&
      response.status() === 200
  );
  let sharedId = '';
  await test.step('Create a new entity', async () => {
    await page.getByRole('button', { name: 'Create entity' }).click();
    const titleField = page.locator('textarea[name="library.sidepanel.metadata.title"]');
    await expect(titleField).toBeVisible();
    await titleField.fill(createdTitle);
    await page.getByRole('button', { name: 'Save' }).click();
    const createResponse = await createResponsePromise;
    const createPayload = await createResponse.json();
    sharedId = createPayload.entity?.sharedId;
    expect(sharedId).toBeTruthy();
  });

  let createdEntityUrl = '';
  await test.step('Open entity and edit title', async () => {
    await gotoWithRetry(`/entity/${sharedId}`, page);
    await expect(page).toHaveURL(/\/(en\/)?entity\/[a-z0-9]+/i);
    createdEntityUrl = page.url().replace('http://localhost:3000', '');
    await page.getByRole('button', { name: 'Edit' }).click();
    const entityTitleField = page.getByRole('tabpanel', { name: 'Info' }).getByRole('textbox').first();
    await expect(entityTitleField).toBeVisible();
    await entityTitleField.fill(updatedTitle);
  });

  const updateResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/entities') &&
      response.request().method() === 'POST' &&
      response.status() === 200
  );
  await test.step('Save edition and verify updated entity', async () => {
    await page.locator('button[type="submit"][form="metadataForm"]').click();
    await updateResponsePromise;
    await gotoWithRetry('/library', page);
    const searchInput = page.locator(
      'input[aria-label="Type something in the search box to get some results."]'
    );
    await searchInput.fill(updatedTitle);
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/searchTerm:%27/);
    await gotoWithRetry(createdEntityUrl, page);
    await expect(page.locator('.item-name').first()).toContainText(updatedTitle);
  });

  await test.step('Delete entity and confirm it is gone', async () => {
    const deleteResponse = await page.request.delete(`/api/entities?sharedId=${sharedId}`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    expect(deleteResponse.ok()).toBeTruthy();
    await gotoWithRetry('/library', page);
    const searchInput = page.locator(
      'input[aria-label="Type something in the search box to get some results."]'
    );
    await searchInput.fill(updatedTitle);
    await searchInput.press('Enter');
    await expect(page.getByText('shown of 0 entities').first()).toBeVisible();
  });
});
