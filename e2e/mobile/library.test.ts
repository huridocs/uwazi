/*global page*/
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import disableTransitions from '../helpers/disableTransitions';
import { scrollTo } from '../helpers/formActions';
import insertFixtures from '../helpers/insertFixtures';

import { prepareToMatchImageSnapshot, testSelectorShot } from '../helpers/regression';

prepareToMatchImageSnapshot();

describe('library toolbar and action buttons', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await expect(page).toClick('a.public-documents');
  });

  afterAll(async () => {
    await logout();
  });

  const checkVisibility = async (selector: string, visible: boolean) => {
    await page.waitForSelector(selector, {
      visible,
    });
  };

  describe('small resolution', () => {
    beforeAll(async () => {
      await page.setViewport({ width: 376, height: 667 });
      await disableTransitions();
    });

    it('should hide the toolbar and actions buttons by default', async () => {
      await checkVisibility('.library-header', false);
      await checkVisibility('.library-footer', false);
      await testSelectorShot('.app-content');
    });

    it('should open the toolbar and actions buttons on demand', async () => {
      await expect(page).toClick('.open-toolbar-button .toggle-toolbar-button');
      await checkVisibility('.library-header', true);
      await expect(page).toClick('.open-actions-button .toggle-footer-button');
      await checkVisibility('.library-footer', true);
      await testSelectorShot('.app-content');
    });

    it('should hide the toolbar and actions buttons on scrolling', async () => {
      await scrollTo('div.item-document:nth-child(6)');
      await checkVisibility('.library-header', false);
      await checkVisibility('.library-footer', false);
    });
  });

  it('should adjust the distribution of elements for a medium resolution', async () => {
    await page.setViewport({ width: 680, height: 667 });
    await expect(page).toClick('.open-toolbar-button .toggle-toolbar-button');
    await checkVisibility('.library-header', true);
    await expect(page).toClick('.open-actions-button .toggle-footer-button');
    await checkVisibility('.library-footer', true);
    await testSelectorShot('.app-content');
    await scrollTo('div.item-document:nth-child(6)');
  });

  it('should adjust the distribution of elements a large resolution', async () => {
    await page.setViewport({ width: 1200, height: 667 });
    await checkVisibility('.library-header', true);
    await checkVisibility('.library-footer', true);
    await testSelectorShot('.app-content');
  });
});
