/*global page*/
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';

import { prepareToMatchImageSnapshot, testSelectorShot } from '../helpers/regression';

prepareToMatchImageSnapshot();

describe('Settings navigation', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  afterAll(async () => {
    await logout();
  });

  describe('mobile', () => {
    beforeAll(async () => {
      //Set resolution for Galaxy S20+
      await page.setViewport({ width: 384, height: 854 });
      await disableTransitions();
    });

    it('should navigate to settings and see only the navigation bar and not the user account screen', async () => {
      await page.waitForSelector('li.only-mobile > a.settings-section');
      await expect(page).toClick('li.only-mobile > a.settings-section');
      await expect(page).not.toMatchElement('.user-details > div > span', { text: 'Username' });
      await testSelectorShot('.app-content');
    });

    it('should navigate to the user account and have a back button', async () => {
      await expect(page).toClick('a', { text: 'Account' });
      await expect(page).toMatchElement('a.only-mobile', { text: 'Back' });
      await testSelectorShot('.app-content');
    });

    it('should go back and enter the template editor', async () => {
      await expect(page).toClick('a.only-mobile', { text: 'Back' });
      await expect(page).toClick('a', { text: 'Templates' });
      await expect(page).toMatchElement(
        '.settings-content > .panel > .panel-heading > .translation',
        { text: 'Templates' }
      );
    });
  });
});
