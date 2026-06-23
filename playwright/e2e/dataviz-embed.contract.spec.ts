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

const PAGE_TITLE = `E2E Dataviz Page ${Date.now()}`;
const DATAVIZ_NAME = `E2E Dataviz ${Date.now()}`;

test('dataviz embed renders in a page and external iframe route', async ({ page, request }) => {
  test.setTimeout(4 * 60 * 1000);

  let datavizId = '';
  let draftPageUrl = '';

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

  await test.step('Login and create a manual dataviz', async () => {
    await loginAsAdmin(page);
    await gotoWithRetry('/en/settings/dataviz/new', page);

    await page.locator('#dataviz-name').fill(DATAVIZ_NAME);
    await page.getByRole('tab', { name: 'Data' }).click();
    await page.getByRole('radio', { name: /Manual \(JSON\)/i }).click();

    const manualEditor = page.locator('.monaco-editor').first();
    await manualEditor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(
      JSON.stringify(
        {
          series: [
            {
              id: 'main',
              label: 'Series 1',
              points: [
                { key: 'a', label: 'Embed Category A', value: 12 },
                { key: 'b', label: 'Embed Category B', value: 8 },
              ],
            },
          ],
        },
        null,
        2
      )
    );

    const saveResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/dataviz') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /^Save$/ }).click();
    const saveResponse = await saveResponsePromise;
    const saved = await saveResponse.json();
    datavizId = saved.id;
    expect(datavizId).toBeTruthy();
  });

  await test.step('Create a page with <Dataviz />', async () => {
    await gotoWithRetry('/settings/pages', page);
    await page.getByRole('link', { name: 'Add page' }).click();

    const titleInput = page.locator('[id^="title-"]').first();
    await titleInput.fill(PAGE_TITLE);

    await page.getByRole('tab', { name: 'HTML' }).click();
    await page.locator('.monaco-editor').first().click();
    await page.keyboard.type(`<h1>${PAGE_TITLE}</h1><Dataviz id="${datavizId}" />`);

    const saveResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/pages') &&
        response.request().method() === 'POST' &&
        response.status() === 200
    );
    await page.getByRole('button', { name: /^Save$/ }).click();
    await saveResponsePromise;
    await expect(page.getByText('Saved successfully').first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole('tab', { name: 'Configuration' }).click();
    const urlInput = page.locator('[id^="page-url-"]').first();
    await expect(urlInput).toBeVisible();
    const pageUrl = (await urlInput.inputValue()).trim();
    draftPageUrl = pageUrl.replace('/page/', '/page-draft/');
    expect(draftPageUrl).toContain('page-draft/');
  });

  await test.step('Draft page renders the dataviz chart', async () => {
    await gotoWithRetry(draftPageUrl, page);
    await expect(page.getByText('Embed Category A')).toBeVisible({ timeout: 30_000 });
  });

  await test.step('External embed route renders the chart for anonymous visitors', async () => {
    await page.context().clearCookies();
    const response = await request.get(`/embed/dataviz/${datavizId}?locale=en`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    await expect(html).toContain('Embed Category A');
    await expect(html).toContain('__DATAVIZ_CHART_OPTION__');
    expect(html).not.toContain('main.js');
  });
});
