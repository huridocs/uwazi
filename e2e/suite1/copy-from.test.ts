import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { host } from '../config';

describe('Copy from', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await page.goto(`${host}/library`);
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  it('should create a new entity', async () => {
    await expect(page).toClick(
      'div.item-document:nth-child(3) > div:nth-child(1) > div:nth-child(1)',
      { text: 'Artavia Murillo y otros' }
    );
    await expect(page).toClick('.sidepanel-footer > .btn-cluster > a', { text: 'View' });
    await expect(page).toClick('.tab-link', {
      text: 'Connections',
    });
    await expect(page).toClick('.entity-footer > .btn-cluster > .edit-metadata', { text: 'Edit' });
    await expect(page).toClick('button', {
      text: 'Add entities / documents',
    });
    await expect(page).toClick('button', {
      text: 'Create Entity',
    });
    await expect(page).toFill('textarea[name="relationships.metadata.title"]', 'Test title');
    await expect(page).toSelect('select', 'Causa');
  });

  it('should copy the metadata from an existing entity', async () => {
    await expect(page).toClick('button', {
      text: 'Copy From',
    });
    await expect(page).toFill(
      'aside.connections-metadata div.search-box > div > input',
      'artavia',
      { delay: 100 }
    );
    await expect(page).toClick('div.copy-from .item-info', { text: 'Artavia Murillo et al' });
    await expect(page).toClick('button', { text: 'Copy Highlighted' });
    await expect(page).toClick(
      'div.btn-cluster:nth-child(2) > button:nth-child(2) > span:nth-child(1) ',
      {
        text: 'Save',
      }
    );
    await expect(page).toClick('.alert.alert-success');
    await expect(page).toClick('.entity-footer > div > button', { text: 'Save' });
  });

  it('should check the data', async () => {
    await expect(page).toClick('.item-info', { text: 'Test title' });
    await expect(page).toMatchElement(
      '.side-panel.connections-metadata > div.sidepanel-body > div > dl:nth-child(3) dd',
      {
        text: 'Costa Rica',
      }
    );
    await expect(page).toMatchElement(
      '.side-panel.connections-metadata > div.sidepanel-body > div > dl:nth-child(4) dd',
      {
        text: 'Activo',
      }
    );
    await expect(page).toMatchElement(
      '.side-panel.connections-metadata > div.sidepanel-body > div > dl:nth-child(5) dd',
      {
        text: 'Derechos reproductivos',
      }
    );
    await expect(page).toMatchElement(
      '.side-panel.connections-metadata > div.sidepanel-body > div > dl:nth-child(8) dd',
      {
        text: 'Dec 19, 2011',
      }
    );
  });
});
