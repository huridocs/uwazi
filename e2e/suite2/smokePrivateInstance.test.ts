import { adminLogin, logout } from '../helpers/login';
import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

const selectors = {
  collection: {
    togglePrivate: 'div.form-element:nth-child(8) > div:nth-child(2) > label:nth-child(1)',
  },
};

describe('Private instance', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await disableTransitions();
  });

  it('should log in as admin, and toggle private instance in collection settings', async () => {
    await adminLogin();
    await page.goto(`${host}/settings/account`);
    await expect(page).toMatchElement('span', { text: 'Account' });
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('a', { text: 'Collection' });
    await expect(page).toClick(selectors.collection.togglePrivate);
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('div.alert', { text: 'Settings updated.' });
  });

  it('shoud log out and be redirected to login page instead of library page', async () => {
    await logout();
    await page.goto(`${host}/library`);
    expect(page.url()).toBe(`${host}/login`);
  });
});
