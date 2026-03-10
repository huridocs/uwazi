/* eslint-disable max-statements */

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

describe('Metadata Extraction', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should be hidden by a feature toggle.', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).not.toMatchElement('a', { text: 'Metadata Extraction' });
  });

  afterAll(async () => {
    await logout();
  });
});
