import { execSync } from 'child_process';
import { expect, request as playwrightRequest, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe.configure({ mode: 'serial' });

test('public form contract creates an entity through /api/public', async ({ page, baseURL }) => {
  execSync('yarn blank-e2e-fixtures', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_NAME: 'uwazi_e2e',
      INDEX_NAME: 'uwazi_e2e',
    },
  });

  await loginAsAdmin(page);

  const templatesResponse = await page.request.get('/api/templates');
  expect(templatesResponse.ok()).toBeTruthy();
  const templatesPayload = await templatesResponse.json();
  const templates = Array.isArray(templatesPayload) ? templatesPayload : templatesPayload.rows;
  const templateId = templates?.[0]?._id;
  expect(templateId).toBeTruthy();

  const settingsResponse = await page.request.get('/api/settings');
  expect(settingsResponse.ok()).toBeTruthy();
  const settingsPayload = await settingsResponse.json();
  const saveSettingsResponse = await page.request.post('/api/settings', {
    data: {
      ...settingsPayload,
      openPublicEndpoint: true,
      allowedPublicTemplates: [templateId],
    },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  expect(saveSettingsResponse.ok()).toBeTruthy();

  await page.context().clearCookies();

  const publicClient = await playwrightRequest.newContext({ baseURL });
  const publicTitle = `Public Submission ${Date.now()}`;
  const publicResponse = await publicClient.post('/api/public', {
    multipart: {
      entity: JSON.stringify({ title: publicTitle, template: templateId }),
    },
    headers: { 'Bypass-Captcha': 'true', 'X-Requested-With': 'XMLHttpRequest' },
  });
  const publicResponseBody = await publicResponse.text();
  expect(publicResponse.ok(), `Public submit failed: ${publicResponse.status()} ${publicResponseBody}`).toBeTruthy();

  const publicPayload = JSON.parse(publicResponseBody);
  const sharedId = publicPayload.sharedId;
  expect(sharedId).toBeTruthy();

  await loginAsAdmin(page);
  const createdEntityResponse = await page.request.get(`/api/entities?sharedId=${sharedId}`);
  expect(createdEntityResponse.ok()).toBeTruthy();
  const createdEntityPayload = await createdEntityResponse.json();
  expect(createdEntityPayload.rows[0].title).toBe(publicTitle);

  await publicClient.dispose();
});
