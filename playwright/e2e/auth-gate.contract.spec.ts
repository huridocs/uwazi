import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe.configure({ mode: 'serial' });

test('auth gate contract with blank fixtures', async ({ page }) => {
  execSync('yarn blank-e2e-fixtures', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_NAME: 'uwazi_e2e',
      INDEX_NAME: 'uwazi_e2e',
    },
  });

  await page.goto('/library');
  await expect(page).toHaveURL(/\/(en\/)?login$/);
  await expect(page.locator('input[name="username"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await loginAsAdmin(page);

  await expect(page).toHaveURL(/\/(en\/)?(library\/?)?(\?.*)?$/);
  const authenticatedUserResponse = await page.request.get('/api/user');
  const authenticatedUser = await authenticatedUserResponse.json();
  expect(authenticatedUser.username).toBe('admin');

  await page.goto('/logout');
  await expect(page).toHaveURL(/\/(en\/)?login$/);
  const loggedOutUserResponse = await page.request.get('/api/user');
  const loggedOutUser = await loggedOutUserResponse.json();
  expect(loggedOutUser).toEqual({});

  await page.goto('/library');
  await expect(page).toHaveURL(/\/(en\/)?login$/);
});
