/* eslint-disable max-statements */

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { waitForNavigation } from '../helpers/formActions';

describe('Metadata Extraction', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await disableTransitions();
  });

  it('should be hidden by a feature toggle.', async () => {
    await adminLogin();
    await waitForNavigation(expect(page).toClick('a', { text: 'Account settings' }));
    await expect(page).not.toMatchElement('a', { text: 'Metadata Extraction' });
  });

  afterAll(async () => {
    await logout();
  });
});
