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
const HTML_MARKER_TEXT = `E2E marker ${Date.now()}`;
const HTML_MARKER_CONTENT = `<h1>${HTML_MARKER_TEXT}</h1>`;

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

  await test.step('Open the new page editor and set title + HTML draft content', async () => {
    await page.getByRole('link', { name: 'Add page' }).click();
    await expect(page).toHaveURL(/\/settings\/pages\/new/);
    // The title input id is locale-prefixed, e.g. #title-en
    const titleInput = page.locator('[id^="title-"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(PAGE_TITLE);
    await page.waitForTimeout(500);
    await expect(titleInput).toHaveValue(PAGE_TITLE);

    const entityViewToggle = page.getByTestId('toggle').first();
    await entityViewToggle.click();
    await page.waitForTimeout(500);
    await expect(entityViewToggle).toBeChecked();
    await entityViewToggle.click();
    await page.waitForTimeout(500);
    await expect(entityViewToggle).not.toBeChecked();

    await page.getByRole('tab', { name: 'HTML' }).click();
    await page.locator('.monaco-editor').first().click();
    await page.keyboard.type(HTML_MARKER_CONTENT);
  });

  let pageUrl = '';
  let postedDraftContent = '';
  await test.step('Save the page and read the published URL from the configuration tab', async () => {
    const saveRequestPromise = page.waitForRequest(
      request =>
        request.url().includes('/api/pages') &&
        request.method() === 'POST' &&
        !!request.postDataJSON()?.locales
    );
    const saveResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/pages') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByRole('button', { name: /^Save$/ }).click();
    const saveRequest = await saveRequestPromise;
    await saveResponsePromise;

    const payload = saveRequest.postDataJSON() as {
      locales?: Record<string, { draft?: { content?: string } }>;
    };
    const firstLocale = Object.values(payload.locales ?? {})[0];
    postedDraftContent = firstLocale?.draft?.content ?? '';
    expect(postedDraftContent).toContain(HTML_MARKER_TEXT);

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

  await test.step('Navigate to the draft URL and verify HTML draft marker renders', async () => {
    const draftPageUrl = pageUrl.replace('/page/', '/page-draft/');
    await gotoWithRetry(draftPageUrl, page);
    await expect(page).toHaveURL(new RegExp(`${draftPageUrl}$`));
    await expect(page.getByRole('heading', { name: HTML_MARKER_TEXT })).toBeVisible();
  });
});

const ENTITY_VIEW_PAGE_TITLE = `E2E Entity View Page ${Date.now()}`;

test('pages contract entity view page shows publish and restore after save', async ({ page }) => {
  test.setTimeout(3 * 60 * 1000);

  await test.step('Login and navigate to Pages settings', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/settings/pages', page);
    await expect(page.getByTestId('settings-pages')).toBeVisible();
  });

  await test.step('Create entity view page and save', async () => {
    await page.getByRole('link', { name: 'Add page' }).click();
    await expect(page).toHaveURL(/\/settings\/pages\/new/);

    const titleInput = page.locator('[id^="title-"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(ENTITY_VIEW_PAGE_TITLE);
    await page.waitForTimeout(500);
    await expect(titleInput).toHaveValue(ENTITY_VIEW_PAGE_TITLE);

    const entityViewToggle = page.getByTestId('toggle').first();
    await entityViewToggle.click();
    await page.waitForTimeout(500);
    await expect(entityViewToggle).toBeChecked();

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
  });

  await test.step('Configuration shows Publish and Restore for entity view page', async () => {
    await page.getByRole('tab', { name: 'Configuration' }).click();
    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible();
    await expect(page.locator('[id^="page-url-"]')).toHaveCount(0);
  });
});
