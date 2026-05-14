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

const MENU_LINK_TITLE = `E2E Menu Link ${Date.now()}`;
const MENU_LINK_URL = '/library';
const LANDING_PAGE = '/library/?q=(allAggregations:!t)';

test('menu contract persists a link in nav and landing page setting', async ({ page }) => {
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

  await test.step('Login and open Menu settings', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/settings/navlinks', page);
    await expect(page.getByRole('button', { name: 'Add link' })).toBeVisible();
  });

  await test.step('Create a new link via the menu form and save it', async () => {
    await page.getByTestId('menu-add-link').click();
    await page.locator('#link-title').fill(MENU_LINK_TITLE);
    await page.locator('#link-url').fill(MENU_LINK_URL);
    await page.getByTestId('menu-form-submit').click();

    const saveResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/settings/links') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByTestId('menu-save').click();
    await saveResponsePromise;
    await expect(page.getByTestId('menu-save')).toBeDisabled();
  });

  await test.step('Reload Menu settings and verify the link persists in the table', async () => {
    await gotoWithRetry('/settings/navlinks', page);
    await expect(page.getByRole('cell', { name: MENU_LINK_TITLE }).first()).toBeVisible();
  });

  await test.step('Visit the home page and verify the link is rendered in the primary nav', async () => {
    await gotoWithRetry('/', page);
    await expect(page.getByText(MENU_LINK_TITLE).first()).toBeVisible();
  });

  await test.step('Set a custom landing page in Collection settings', async () => {
    await gotoWithRetry('/settings/collection', page);
    const landingInput = page.locator('#landing-page');
    await expect(landingInput).toBeVisible();
    await landingInput.fill(LANDING_PAGE);

    const saveResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/settings') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByRole('button', { name: 'Save' }).first().click();
    await saveResponsePromise;
    await expect(page.getByText('Settings updated').first()).toBeVisible();
  });

  await test.step('Reload Collection settings and verify the landing page value persisted', async () => {
    await gotoWithRetry('/settings/collection', page);
    await expect(page.locator('#landing-page')).toHaveValue(LANDING_PAGE);
  });

  await test.step('Visit / and confirm the home renders without errors with the custom landing applied', async () => {
    await gotoWithRetry('/', page);
    const searchInput = page.locator(
      'input[aria-label="Type something in the search box to get some results."]'
    );
    await expect(searchInput).toBeVisible();
    await expect(page.getByText(MENU_LINK_TITLE).first()).toBeVisible();
  });
});
