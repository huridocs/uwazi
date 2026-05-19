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

test('library search contract with seeded fixtures', async ({ page }) => {
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

  await test.step('Login and open library search', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry(
      "/library/?q=(allAggregations:!f,includeUnpublished:!t,order:desc,sort:creationDate,treatAs:number,unpublished:!f)",
      page
    );
  });

  const searchTerms = ['Midnight', 'Solaris', 'Guardian', 'Good Ones', 'Organizations'];
  let firstResultSharedId: string | undefined;
  let acceptedSearchTerm: string | undefined;
  await test.step('Search until a result is found', async () => {
    const searchInput = page.locator(
      'input[aria-label="Type something in the search box to get some results."]'
    );
    await expect(searchInput).toBeVisible();
    for (const term of searchTerms) {
      await searchInput.fill(term);
      const searchResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/search') &&
          response.request().method() === 'GET' &&
          response.status() === 200
      );
      await searchInput.press('Enter');
      const searchResponse = await searchResponsePromise;
      const searchPayload = await searchResponse.json();
      if (searchPayload.totalRows > 0) {
        firstResultSharedId = searchPayload.rows[0].sharedId;
        acceptedSearchTerm = term;
        break;
      }
    }
  });

  await test.step('Open first result from search', async () => {
    expect(firstResultSharedId).toBeTruthy();
    expect(acceptedSearchTerm).toBeTruthy();
    await expect(page).toHaveURL(/searchTerm:%27/);

    await gotoWithRetry(`/entity/${firstResultSharedId}`, page);
    await expect(page).toHaveURL(/\/(en\/)?entity\/[a-z0-9]+/i);
  });
});
