import insertFixtures from '../helpers/insertFixtures';
import proxyMock from '../helpers/proxyMock';
import { adminLogin, logout, login } from '../helpers/login';
import { host } from '../config';
import disableTransitions from '../helpers/disableTransitions';
import { expectDocumentCountAfterSearch, refreshIndex } from '../helpers/elastichelpers';

const selectLookupOption = async (
  searchTerm: string,
  option: string,
  expectToDo: boolean = true
) => {
  await expect(page).toClick('.userGroupsLookupField');
  await expect(page).toFill('.userGroupsLookupField', searchTerm);
  await page.waitForSelector('.userGroupsLookupField li .press-enter-note');
  if (expectToDo) {
    await expect(page).toClick('.userGroupsLookupField li .member-list-item', {
      text: option,
    });
  } else {
    await expect(page).not.toMatchElement('.userGroupsLookupField li .member-list-item', {
      text: option,
    });
  }
};

const countPrivateEntities = async () =>
  page.$$eval('.item-document .fa-lock', items => items.length);

const reLogin = async (username: string, password: string) => {
  await logout();
  await login(username, password);
  await disableTransitions();
};

describe('Share entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await page.goto(`${host}/settings/users`);
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  it('should create a colaborator in the shared User Group and share an entity', async () => {
    await expect(page).toClick('button', { text: 'Add user' });
    await expect(page).toFill('input[name=email]', 'rock@stone.com');
    await expect(page).toFill('input[name=username]', 'colla');
    await expect(page).toFill('input[name=password]', 'borator');
    await expect(page).toClick('.multiselectItem-name', {
      text: 'Asesores legales',
    });
    await expect(page).toClick('button', { text: 'Create User' });
  });

  it('should share an entity with the collaborator', async () => {
    await expect(page).toClick('a.public-documents');
    await expect(page).toClick('.item-document', {
      text: 'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
    });
    await page.waitForSelector('.share-btn');
    await expect(page).toClick('button', { text: 'Share' });
    await selectLookupOption('colla', 'colla');
    await expect(page).toSelect(
      '.member-list-wrapper  tr:nth-child(3) > td:nth-child(2) > select',
      'Can edit'
    );
  });

  it('should unshare entities publicly', async () => {
    await expect(page).toSelect(
      '.member-list-wrapper  tr:nth-child(2) > td:nth-child(2) > select',
      'Remove'
    );
    await expect(page).toClick('button', { text: 'Save changes' });
    await page.waitForSelector('.share-modal', { hidden: true });
    await refreshIndex();
    await expect(page).not.toMatchElement('.item-document', {
      text: 'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
    });
  });

  it('should share entities publicly', async () => {
    await expect(page).toClick('a.private-documents');
    await expect(page).toClick('.item-document', {
      text: 'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
    });
    await page.waitForSelector('.share-btn');
    await expect(page).toClick('button', { text: 'Share' });
    await selectLookupOption('', 'Public');
    await expect(page).toClick('button', { text: 'Save changes' });
    await page.waitForSelector('.share-modal', { hidden: true });
    await refreshIndex();
    await page.waitFor('.item-document');
    await expect(page).not.toMatchElement('.item-document', {
      text: 'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
    });
  });

  it('should not be able to unshare entities publicly as a collaborator', async () => {
    await logout();
    await login('colla', 'borator');
    await disableTransitions();
    await page.waitFor('.item-document');
    await expect(page).toClick('.item-document', {
      text: 'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
    });
    await page.waitForSelector('.share-btn');
    await expect(page).toClick('button', { text: 'Share' });
    await expect(page).not.toMatchElement(
      '.member-list-wrapper  tr:nth-child(2) > td:nth-child(2) > select'
    );
    await expect(page).toClick('button', { text: 'Close' });
  });

  it('should not be able to share entity as a collaborator', async () => {
    await expect(page).toClick('a.private-documents');
    await expect(page).toClick('button', { text: 'New entity' });
    await expect(page).toFill('textarea[name="uploads.sidepanel.metadata.title"]', 'Test title');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await refreshIndex();
    await expect(page).toClick('.item-document', {
      text: 'Test title',
    });
    await page.waitForSelector('.share-btn');
    await expect(page).toClick('button', { text: 'Share' });
    await selectLookupOption('', 'Public', false);
  });

  it('should show mixed access', async () => {
    await reLogin('admin', 'admin');
    await expect(page).toClick('.multiselectItem-name', {
      text: 'Include unpublished documents',
    });
    await expect(page).toFill('input[name="library.search.searchTerm"]', 'test 2016');
    await expect(page).toClick('[aria-label="Search button"]');
    await expectDocumentCountAfterSearch(page, 3);
    await expect(page).toClick('button', { text: 'Select all' });
    await expect(page).toClick('.is-active .share-btn', {
      text: 'Share',
    });
    await page.waitForSelector('.members-list tr:nth-child(2)');
    await expect(page).toMatchElement('.members-list tr:nth-child(2) select', {
      text: 'Mixed access',
    });
  });

  it('should keep publishing status if mixed access selected', async () => {
    await expect(page).toSelect('.member-list-wrapper  tr:nth-child(3) select', 'Can see');
    await expect(page).toClick('button', { text: 'Save changes' });
    await refreshIndex();
    await page.reload();
    await expectDocumentCountAfterSearch(page, 3);
    expect(await countPrivateEntities()).toBe(1);
  });
});
