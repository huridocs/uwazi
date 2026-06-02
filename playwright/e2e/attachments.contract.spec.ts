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

const SEARCH_TERM = 'Midnight';
const RENAMED_FILE = `e2e-renamed-${Date.now()}.pdf`;

async function openSidepanelForFirstHit(page: Page, term: string) {
  const searchInput = page.locator(
    'input[aria-label="Type something in the search box to get some results."]'
  );
  await expect(searchInput).toBeVisible();
  await searchInput.fill(term);
  const searchResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/search') &&
      response.request().method() === 'GET' &&
      response.status() === 200
  );
  await searchInput.press('Enter');
  await searchResponsePromise;
  const firstResult = page.locator('h2.item-name').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();
  await expect(page.locator('.side-panel.is-active')).toBeVisible();
}

test('attachments contract preserves renamed file across reload', async ({ page }) => {
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

  await test.step('Login and open library', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry(
      "/library/?q=(allAggregations:!f,includeUnpublished:!t,order:desc,sort:creationDate,treatAs:number,unpublished:!f)",
      page
    );
  });

  await test.step('Open the hero sidepanel and confirm filelist has at least one document', async () => {
    await openSidepanelForFirstHit(page, SEARCH_TERM);
    const fileItems = page.locator('.side-panel.is-active .filelist > ul > li');
    await expect(fileItems.first()).toBeVisible();
    expect(await fileItems.count()).toBeGreaterThan(0);
  });

  await test.step('Rename the first file via the UI and verify the new name appears', async () => {
    const sidepanel = page.locator('.side-panel.is-active');
    const firstFile = sidepanel.locator('.filelist > ul > li').first();
    await firstFile.getByRole('button', { name: 'Edit' }).click();
    const nameInput = sidepanel.locator('#originalname');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(RENAMED_FILE);
    const saveResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/files') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await sidepanel.getByRole('button', { name: 'Save' }).click();
    await saveResponsePromise;
    await expect(sidepanel.locator('.filelist').getByText(RENAMED_FILE)).toBeVisible();
  });

  await test.step('Reload library and verify the rename persisted in the UI', async () => {
    await gotoWithRetry(
      "/library/?q=(allAggregations:!f,includeUnpublished:!t,order:desc,sort:creationDate,treatAs:number,unpublished:!f)",
      page
    );
    await openSidepanelForFirstHit(page, SEARCH_TERM);
    const sidepanel = page.locator('.side-panel.is-active');
    await expect(sidepanel.locator('.filelist').getByText(RENAMED_FILE)).toBeVisible();
  });
});
