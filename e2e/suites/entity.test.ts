/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { goToRestrictedEntities } from '../helpers/publishedFilter';

describe('Entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('Should create new entity', async () => {
    await goToRestrictedEntities();
    await expect(page).toClick('button', { text: 'Create entity' });
    await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', 'Test title');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
  });

  afterAll(async () => {
    await logout();
  });
});
