import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { getContentBySelector } from '../helpers/selectorUtils';

const selectors = {
  searchInLibrary:
    '#app > div.content > div > div > div > main > div.list-view-mode > div.buttons-group.toggle-button.only-mobile > button',
  sidePanelFiltersTitle:
    '#app > div.content > div > div > div > aside.is-active > div.sidepanel-body > div.sidepanel-title > div:nth-child(1) > span',
  firstEntityView:
    '#app > div.content > div > div > div > main > div.documents-list > div > div.item-group > div:nth-child(1) > div.item-actions > div > a > span',
};

describe('Custom home page and styles', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await expect(page).toClick('a.public-documents');
    // iphone 6 measurements
    await page.setViewport({ width: 376, height: 667 });
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  describe('library view', () => {
    it('when clicking on the search button a side panel should appear', async () => {
      await expect(page).toClick(selectors.searchInLibrary);
      await expect(page).toMatchElement(selectors.sidePanelFiltersTitle, { text: 'Filters' });
      await expect(page).toClick('button[aria-label="Close side panel"]');
    });
  });

  describe('Entity view', () => {
    it('should show attachments', async () => {
      await expect(page).toClick(selectors.firstEntityView);
      await expect(page).toMatchElement('div.file > div.file-originalname');
      const [filename] = await getContentBySelector('div.file > div.file-originalname');
      expect(filename).toEqual('SamplePDF.pdf');
    });
  });
});
