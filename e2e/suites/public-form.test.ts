import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { refreshIndex } from '../helpers/elastichelpers';
import { goToRestrictedEntities } from '../helpers/publishedFilter';

const createMenuLinkToPublicForm = async (linkText: string) => {
  const element = await page.waitForSelector('.alert-info a.pull-right[target="_blank"]');
  const value = (
    await element.evaluate(el => (el instanceof HTMLAnchorElement ? el.href : ''))
  ).replace('http://localhost:3000', '');
  await expect(page).toClick('a', { text: 'Menu' });
  await expect(page).toClick('a', { text: 'Add link' });
  await expect(page).toFill('input[name="settings.navlinksData.links[0].title"]', linkText);
  await expect(page).toFill('input[name="settings.navlinksData.links[0].url"]', value);
  await expect(page).toClick('button', { text: 'Save' });
  await expect(page).toClick('.alert.alert-success');
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
    await expect(page).toClick('.alert.alert-success');
    await createMenuLinkToPublicForm('Public Form Link');
  });

  it('should visit the page and do a submit', async () => {
    await expect(page).toClick('a', { text: 'Public Form Link' });

    await expect(page).toFill('input[name="publicform.title"]', 'Test public submit entity');
    await expect(page).toFill(
      'input[name="publicform.metadata.resumen"]',
      'This was submited via public form'
    );
    await expect(page).toClick('span', { text: 'Bahamas' });
    await expect(page).toFill('.captcha input', '42hf');
    await expect(page).toClick('button', { text: 'Submit' });
    await expect(page).toClick('.alert.alert-success');
  });

  it('should check the newly created entity', async () => {
    await refreshIndex();
    await goToRestrictedEntities();
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
