import { expect, Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin');
  const loginResponsePromise = page.waitForResponse(
    response => response.url().includes('/api/login') && response.request().method() === 'POST'
  );
  await page.locator('button[type="submit"]').click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();

  // Mirror Cypress behavior: rely on successful auth request, not route text assumptions.
  const sessionCookie = (await page.context().cookies()).find(cookie => cookie.name.includes('connect'));
  expect(sessionCookie).toBeTruthy();
}
