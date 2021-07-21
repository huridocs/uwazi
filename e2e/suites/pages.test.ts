/*eslint max-len: ["error", 500], */
import { host } from '../config';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import disableTransitions from '../helpers/disableTransitions';

const localSelectors = {
  pagesButtonSelector:
    '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(5)',
  createNewPageButton:
    '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  pageTitleInput:
    '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.metadataTemplate-heading.panel-heading > div > div > input',
  pageContentsInput: '.tab-content > textarea',
};

describe('pages path', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  describe('login', () => {
    it('should log in as admin then click the settings nav button', async () => {
      await page.goto(`${host}/settings/account`);
    });
  });

  describe('Pages', () => {
    it('should create a basic page', async () => {
      await page.click(localSelectors.pagesButtonSelector);
      await page.click(localSelectors.createNewPageButton);
      await expect(page).toFill(localSelectors.pageTitleInput, 'Page title');
      await expect(page).toFill(localSelectors.pageContentsInput, 'Page contents');
      await page.click('form > div.settings-footer > button.save-template');
      await page.waitForSelector(
        'div.panel-body.page-viewer.document-viewer > div.alert-info:nth-child(2)'
      );

      const text = await page.$$eval(
        'div.panel-body.page-viewer.document-viewer > div.alert-info:nth-child(2)',
        element => element[0].textContent
      );

      expect(text).toContain('page');
      expect(text).toContain('(view page)');
    });

    it('should navigate to page URL', async () => {
      const link = await page.$$eval(
        'div.panel-body.page-viewer.document-viewer > div.alert.alert-info a',
        (elements: Element[]) => (elements[0] as HTMLLinkElement).href
      );

      const response = await page.goto(link);
      expect(response?.status()).toEqual(200);

      const text = await page.$$eval(
        '#app > div.content > div > div > main div.markdown-viewer',
        element => element[0].textContent
      );
      expect(text).toContain('Page contents');
    });
  });
});
