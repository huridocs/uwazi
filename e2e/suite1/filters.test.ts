import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

describe('Filters', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  it('should go to the settings filters menu', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('a', { text: 'Filters' });
  });

  it('should create a group called Test Group and add items to it', async () => {
    await expect(page).toClick('button', { text: 'Create group' });
    await expect(page).toFill('input[data-testid="filter_group_0"]', 'Test Group');
    //debounce time
    await page.waitForTimeout(200);
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('div.alert', { text: 'Settings updated' });
  });

  it('should delete the filters group', async () => {
    await expect(page).toClick('button.text-white.bg-error-700');
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('div.alert', { text: 'Settings updated' });
    await expect(page).not.toMatchElement('div.input-group > input', { text: 'Test Group' });
  });
});
