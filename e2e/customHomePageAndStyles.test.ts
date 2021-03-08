import { adminLogin, logout } from '../helpers/login';
import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

describe('Custom home page and styles', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await disableTransitions();
  });

  it('should log in and navigate to settings page', async () => {
    await adminLogin();
    await expect(page).toMatchElement('span', { text: 'Account' });
    await expect(page).toClick('a', { text: 'Account settings' });
  });
});
