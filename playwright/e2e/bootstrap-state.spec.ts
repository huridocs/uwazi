import { execSync } from 'child_process';
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { setupBootstrapDataset } from './helpers/setupData';

test.describe.configure({ mode: 'serial' });

test('bootstrap Uwazi state from blank fixtures', async ({ page }) => {
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

  await test.step('Login and execute bootstrap setup', async () => {
    await loginAsAdmin(page);
    await setupBootstrapDataset(page);
    await expect(page.context().cookies()).toBeTruthy();
  });
});
