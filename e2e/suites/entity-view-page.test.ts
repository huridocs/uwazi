import { adminLogin, logout } from '../helpers/login';
import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

describe('Entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should create a basic page and enable it for entity view', async () => {
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });
    await expect(page).toFill('input[name="page.data.title"]', 'My entity view page');
    await expect(page).toFill(
      '.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea',
      '<h1>My entity view</h1>'
    );
    await expect(page).toClick('.slider');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
  });

  it('should set the template as entity view', async () => {
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Templates' });
    await expect(page).toClick('a', { text: 'Ordenes del presidente' });
    await expect(page).toClick('.slider');
    await expect(page).toSelect('select.form-control', 'My entity view page');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
  });

  it('should display the entity in its custom page', async () => {
    await page.goto(`${host}`);
    await page.reload();
    await expect(page).toClick(
      'div.item-document:nth-child(4) > div:nth-child(3) > div:nth-child(2)'
    );
    await expect(page).toMatchElement('h1', { text: 'My entity view' });
  });

  afterAll(async () => {
    await logout();
  });
});
