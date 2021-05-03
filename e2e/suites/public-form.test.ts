import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { refreshIndex } from '../helpers/elastichelpers';

async function getViewPageOpenedTab() {
  const [newTab] = await Promise.all([
    new Promise(resolve => browser.once('targetcreated', target => resolve(target.page()))),
    expect(page).toClick('a', { text: 'view page' }),
  ]);

  return newTab;
}

describe('Custom home page and styles', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  it('should white list the template', async () => {
    await adminLogin();
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Collection' });
    await expect(page).toClick(
      '#collectionSettings > div:nth-child(16) > div > div.toggle-children-button'
    );
    await expect(page).toClick('span', { text: 'Mecanismo' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('.alert.alert-success');
  });

  it('should create a page with a public form', async () => {
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });
    await expect(page).toFill('input[name="page.data.title"]', 'Public Form Page');
    await expect(page).toFill(
      '.markdownEditor textarea',
      '<PublicForm template="58ada34c299e82674854504b" />'
    );

    await expect(page).toClick('button', { text: 'Save' });
  });

  it('should visit the page and do a submit', async () => {
    const newTab = await getViewPageOpenedTab();

    await expect(newTab).toFill('input[name="publicform.title"]', 'Test public submit entity');
    await expect(newTab).toFill(
      'input[name="publicform.metadata.resumen"]',
      'This was submited via public form'
    );
    await expect(newTab).toClick('span', { text: 'Bahamas' });
    await expect(newTab).toFill('.captcha input', '42hf');
    await expect(newTab).toClick('input[type="submit"]');
    await expect(newTab).toClick('.alert.alert-success');
  });

  it('should check the newly created entity', async () => {
    await page.bringToFront();
    await refreshIndex();
    await expect(page).toClick('a', {
      text: 'Private documents',
    });
    await expect(page).toClick('.item-name span', {
      text: 'Test public submit entity',
    });
    await expect(page).toMatchElement('.metadata-name-resumen', {
      text: 'This was submited via public form',
    });
    await expect(page).toMatchElement('.metadata-name-paises', {
      text: 'Bahamas',
    });
  });
});
