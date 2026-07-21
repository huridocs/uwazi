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

const HERO_SEARCH_TERM = 'Midnight';

test('relationships view contract navigates from hero hub to related organization', async ({
  page,
}) => {
  test.setTimeout(3 * 60 * 1000);

  await test.step('Restore seeded fixtures', async () => {
    execSync('yarn e2e-fixtures', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_NAME: 'uwazi_e2e',
        INDEX_NAME: 'uwazi_e2e',
      },
    });
  });

  await test.step('Login and search the hero in the library', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry(
      "/library/?q=(allAggregations:!f,includeUnpublished:!t,order:desc,sort:creationDate,treatAs:number,unpublished:!f)",
      page
    );
    const searchInput = page.locator(
      'input[aria-label="Type something in the search box to get some results."]'
    );
    await expect(searchInput).toBeVisible();
    await searchInput.fill(HERO_SEARCH_TERM);
    const searchResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/search') &&
        response.request().method() === 'GET' &&
        response.status() === 200
    );
    await searchInput.press('Enter');
    await searchResponsePromise;
  });

  await test.step('Open the hero entity from the sidepanel View link', async () => {
    const firstResult = page.locator('h2.item-name').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
    const sidepanel = page.locator('.side-panel.is-active');
    await expect(sidepanel).toBeVisible();
    await sidepanel.locator('a.edit-metadata', { hasText: 'View' }).first().click();
    await expect(page).toHaveURL(/\/(en\/)?entity\/[a-z0-9]+/i);
    await expect(page.locator('h1.item-name').first()).toBeVisible();
  });

  await test.step('Open the Relationships tab and verify the related organization is listed', async () => {
    await page.locator('[aria-label="Relationships"]').first().click();
    await expect(page.locator('#tabpanel-relationships')).toBeVisible();
    await expect(page.locator('div.relationshipsHub').first()).toBeVisible();
    await expect(page.locator('div.rightRelationship').first()).toBeVisible();
  });

  await test.step('Navigate to the related organization through the hub item', async () => {
    await page.locator('div.rightRelationship').first().click();
    const previewSidepanel = page.locator('.side-panel.is-active').last();
    await expect(previewSidepanel).toBeVisible();
    await expect(previewSidepanel.locator('a[href*="/entity/"]').first()).toBeVisible();
  });
});
