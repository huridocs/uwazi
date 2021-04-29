import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

const selectors = {
  pageContentsInput:
    '.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea',
  useCustomLandingPage:
    '#collectionSettings > div:nth-child(5) > div > div.toggle-children-button > label',
};

describe('Custom home page and styles', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  it('should log in and create add page', async () => {
    await adminLogin();
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });
  });

  it('should create a page with a public form', async () => {
    await expect(page).toFill('input[name="page.data.title"]', 'Public Form Page');
    await expect(page).toFill(
      selectors.pageContentsInput,
      '<PublicForm template="58ada34c299e82674854504b" />'
    );

    await expect(page).toClick('button', { text: 'Save' });
  });

  it('should visit the page and do a submit', async () => {
    const [newTab] = await Promise.all([
      new Promise(resolve => browser.once('targetcreated', target => resolve(target.page()))),
      expect(page).toClick('a', { text: 'view page' }),
    ]);

    await expect(newTab).toFill('input[name="publicform.title"]', 'Test public submit');
    await expect(newTab).toFill(
      'input[name="publicform.metadata.resumen"]',
      'This was submited via public form'
    );
    await expect(newTab).toFill('.captcha input', '42hf');
    await expect(newTab).toClick('input[type="submit"]');
  });
});
