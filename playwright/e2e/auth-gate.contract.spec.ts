import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe.configure({ mode: 'serial' });

test('auth gate contract with blank fixtures', async ({ page }) => {
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

  await test.step('Open protected route and see login form', async () => {
    await page.goto('/library');
    await expect(page).toHaveURL(/\/(en\/)?login$/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  await test.step('Login as admin', async () => {
    await loginAsAdmin(page);
  });

  await test.step('Verify authenticated session', async () => {
    await expect(page).toHaveURL(/\/(en\/)?(library\/?)?(\?.*)?$/);
    const authenticatedUserResponse = await page.request.get('/api/user');
    const authenticatedUser = await authenticatedUserResponse.json();
    expect(authenticatedUser.username).toBe('admin');
  });

  await test.step('Logout and verify session is cleared', async () => {
    await page.goto('/logout');
    await expect(page).toHaveURL(/\/(en\/)?login$/);
    const loggedOutUserResponse = await page.request.get('/api/user');
    const loggedOutUser = await loggedOutUserResponse.json();
    expect(loggedOutUser).toEqual({});
  });

  await test.step('Try protected route again and get redirected', async () => {
    await page.goto('/library');
    await expect(page).toHaveURL(/\/(en\/)?login$/);
  });
});
