/*global page*/

import { adminLogin, logout } from './helpers/login';
import proxyMock from './helpers/proxyMock';

describe('Entities', () => {
  beforeAll(async () => {
    await proxyMock();
    await adminLogin();
  });

  it('Should create new entity', async () => {
    await expect(page).toClick('a', { text: 'Private documents' });
    await expect(page).toClick('button', { text: 'New entity' });
    await expect(page).toFill('textarea[name="uploads.sidepanel.metadata.title"]', 'Test title');
    await expect(page).toMatchElement('button', { type: 'submit', text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
  });

  afterAll(async () => {
    await logout();
  });
});
