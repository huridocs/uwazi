/*global page*/

import proxyMock from '../helpers/proxyMock';
import disableTransitions from '../helpers/disableTransitions';
import { scrollTo } from '../helpers/formActions';
import { host } from '../config';
import { prepareToMatchImageSnapshot, testSelectorShot } from '../helpers/regression';

prepareToMatchImageSnapshot();

describe('library toolbar and action buttons', () => {
  beforeAll(async () => {
    //await insertFixtures();
    await proxyMock();
    await page.goto(`${host}/library`);
    await page.setViewport({ width: 376, height: 667 });
    await disableTransitions();
  });

  describe('small resolution', () => {
    const checkVisibility = async (selector: string, visible: boolean) => {
      await page.waitForSelector(selector, {
        visible,
      });
    };
    beforeAll(async () => {});
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
});
