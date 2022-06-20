/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

describe('Add language', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  // eslint-disable-next-line max-statements
  it('Should add a language successfully even after templates values are changed', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('span', { text: 'Templates' });
    await expect(page).toClick('a', { text: 'País' });
    await expect(page).toClick(
      'ul.metadataTemplate-list> li:nth-child(3) > div > div > button.property-edit'
    );
    await expect(page).toClick('span', { text: 'Show in cards' });
    await expect(page).toClick('span', { text: 'Save' });
    await expect(page).toClick('span', { text: 'Languages' });
    await expect(page).toClick(
      'ul.list-group.document-types > li:nth-child(1) > div > button.template-remove'
    );
    await page.waitForSelector('div.modal-content');
    await expect(page).toFill('div.modal-content div.modal-body input', 'CONFIRM');
    await expect(page).toClick('span', { text: 'Accept' });
    await expect(page).toMatch('Saved successfully.');
  });

  afterAll(async () => {
    await logout();
  });
});
