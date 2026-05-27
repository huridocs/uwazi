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

const PAGE_TITLE = `E2E Custom Page ${Date.now()}`;
const PAGE_MARKER_TEXT = `E2E Marker ${Date.now()}`;
const PAGE_HTML_CONTENT = `<h1 id="e2e-marker">${PAGE_MARKER_TEXT}</h1>`;

test('pages contract creates a custom page that renders at its URL', async ({ page }) => {
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

  await test.step('Login and navigate to Pages settings', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/settings/pages', page);
    await expect(page.getByTestId('settings-pages')).toBeVisible();
  });

  await test.step('Open the new page editor and set the title', async () => {
    await page.getByRole('link', { name: 'Add page' }).click();
    await expect(page).toHaveURL(/\/settings\/pages\/new/);
    // The title input id is locale-prefixed, e.g. #title-en
    const titleInput = page.locator('[id^="title-"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(PAGE_TITLE);
  });

  await test.step('Switch to the HTML tab and type the HTML content', async () => {
    await page.getByRole('tab', { name: 'HTML' }).click();
    const monacoEditor = page.locator('.monaco-editor').first();
    await expect(monacoEditor).toBeVisible();
    await monacoEditor.click();
    await page.keyboard.insertText(PAGE_HTML_CONTENT);
    // The CodeEditor commits content via a 500ms debounce; wait for it before saving.
    await page.waitForTimeout(800);
  });

  let pageUrl = '';
  await test.step('Save the page and read the published URL from the configuration tab', async () => {
    const saveResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/pages') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByRole('button', { name: /^Save$/ }).click();
    await saveResponsePromise;
    await expect(page.getByText('Saved successfully').first()).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/pages\/edit\/[a-z0-9]+/i);

    await page.getByRole('tab', { name: 'Configuration' }).click();
    // The URL input id is locale-prefixed, e.g. #page-url-en
    const pageUrlInput = page.locator('[id^="page-url-"]').first();
    await expect(pageUrlInput).toBeVisible();
    await expect(pageUrlInput).toHaveValue(/\/page\/[a-z0-9]+\/.+/i);
    pageUrl = (await pageUrlInput.inputValue()).trim();
    expect(pageUrl).toMatch(/\/page\/[a-z0-9]+\/.+/i);
  });

  await test.step('Navigate to the page URL and verify the custom marker renders', async () => {
    await gotoWithRetry(pageUrl, page);
    await expect(page.locator('h1#e2e-marker')).toHaveText(PAGE_MARKER_TEXT);
  });
});
