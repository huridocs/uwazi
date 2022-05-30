import insertFixtures from '../helpers/insertFixtures';
import proxyMock from '../helpers/proxyMock';
import { adminLogin, logout, login } from '../helpers/login';
import disableTransitions from '../helpers/disableTransitions';
import { expectDocumentCountAfterSearch, refreshIndex } from '../helpers/elastichelpers';
import { goToRestrictedEntities, goToPublishedEntities } from '../helpers/publishedFilter';
import { createUser } from '../helpers/createUser';

describe('Share entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  const titleEntity1 =
    'Resolución de la Corte IDH. Supervisión de cumplimiento de Sentencia de 29 de junio de 2005';
  const titleEntity2 = 'Applicability of Article 65 of the American Convention on Human Rights';
  const titleEntity3 = 'Article 65 of the American Convention on Human Rights';
  const titleEntity4 = 'Aitken';
  const titlePublic1 = 'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014';

  const getEntitiesCollaborators = async () =>
    page.$$eval('.members-list tr .member-list-item', items => items.map(item => item.textContent));

  const checkAccessOfPersons = async (accesses: string[]) =>
    Promise.all(
      accesses.map(async (access, index) =>
        expect(page).toMatchElement(`.members-list tr:nth-child(${index + 1}) select`, {
          text: access,
        })
      )
    );

  it('should create a collaborator in the shared User Group', async () => {
    await createUser({
      username: 'colla',
      password: 'borator',
      email: 'rock@stone.com',
      group: 'Asesores legales',
    });
  });

  // eslint-disable-next-line max-statements
  it('Should list available collaborators of an entity', async () => {
    await goToRestrictedEntities();
    await expect(page).toClick('.item-document', {
      text: titleEntity1,
    });
    await page.waitForSelector('.share-btn');
    await expect(page).toClick('button', { text: 'Share' });
    await expect(page).toClick('.userGroupsLookupField > input');
    await page.waitForSelector('.userGroupsLookupField li .press-enter-note');
    const availableCollaborators = await page.$$eval(
      '.userGroupsLookupField li .member-list-item',
      items => items.map(item => item.textContent)
    );
    expect(availableCollaborators).toEqual(['Activistas', 'Asesores legales', 'Public']);
  });

  const selectLookupOption = async (searchTerm: string, option: string) => {
    await expect(page).toFill('.userGroupsLookupField input', searchTerm);
    await page.waitForSelector('.userGroupsLookupField li .press-enter-note');
    await expect(page).toClick('.userGroupsLookupField li .member-list-item', {
      text: option,
    });
  };

  it('Should update the permissions of an entity', async () => {
    await selectLookupOption('editor', 'editor');
    await selectLookupOption('Ase', 'Asesores legales');
    const selectedCollaborators = await getEntitiesCollaborators();
    expect(selectedCollaborators).toEqual([
      'Administrators and Editors',
      'editor',
      'Asesores legales',
    ]);
    await expect(page).toSelect(
      '.member-list-wrapper  tr:nth-child(2) > td:nth-child(2) > select',
      'Can edit'
    );
    await page.waitForSelector('.confirm-button');
    await expect(page).toClick('button', {
      text: 'Save changes',
    });
    await page.waitForSelector('.share-modal', { hidden: true });
  });

  it('Should not keep previous entity data', async () => {
    await expect(page).toClick('.item-document', {
      text: titleEntity2,
    });
    await expect(page).toClick('button', { text: 'Share' });
    await expect(page).toClick('.userGroupsLookupField');
    await page.waitForSelector('.members-list tr:nth-child(1) .member-list-item');
    expect(await getEntitiesCollaborators()).toEqual(['Administrators and Editors']);
    await expect(page).toClick('button', { text: 'Close' });
    await page.waitForSelector('.share-modal', { hidden: true });
  });

  it('Should load saved permissions for each entity', async () => {
    await expect(page).toClick('.item-document', {
      text: titleEntity1,
    });
    await expect(page).toClick('button', { text: 'Share' });
    await page.waitForSelector('.members-list tr:nth-child(2) .member-list-item');
    expect(await getEntitiesCollaborators()).toEqual([
      'Administrators and Editors',
      'Asesores legales',
      'editor',
    ]);
    await checkAccessOfPersons(['Can edit', 'Can see', 'Can edit']);
    await expect(page).toClick('button', { text: 'Close' });
    await page.waitForSelector('.share-modal', { hidden: true });
  });

  it('Should open the share modal for multiple selection', async () => {
    await expect(page).toClick('button', { text: 'Select all' });
    await expect(page).toClick('.is-active .share-btn', {
      text: 'Share',
    });
    await page.waitForSelector('.members-list tr:nth-child(2)');
    const loadedCollaborators = await getEntitiesCollaborators();
    expect(loadedCollaborators).toEqual([
      'Administrators and Editors',
      'Asesores legales',
      'editor',
    ]);

    await checkAccessOfPersons(['Can edit', 'Mixed access', 'Mixed access']);
    await expect(page).toClick('button', { text: 'Close' });
    await page.waitForSelector('.share-modal', { hidden: true });
  });

  it('should share other entities with the collaborator', async () => {
    await expect(page).toClick('.item-document', {
      text: titleEntity3,
    });
    await page.waitForSelector('.share-btn');
    await expect(page).toClick('button', { text: 'Share' });
    await selectLookupOption('colla', 'colla');
    await expect(page).toSelect(
      '.member-list-wrapper  tr:nth-child(2) > td:nth-child(2) > select',
      'Can edit'
    );
    await expect(page).toClick('button', { text: 'Save changes' });
    await page.waitForSelector('.share-modal', { hidden: true });
  });

  it('should share other entities with the collaborator via the group', async () => {
    await expect(page).toClick('.item-document', {
      text: titleEntity4,
    });
    await page.waitForSelector('.share-btn');
    await expect(page).toClick('button', { text: 'Share' });
    await selectLookupOption('Ase', 'Asesores legales');
    await expect(page).toSelect(
      '.member-list-wrapper  tr:nth-child(2) > td:nth-child(2) > select',
      'Can edit'
    );
    await expect(page).toClick('button', { text: 'Save changes' });
    await page.waitForSelector('.share-modal', { hidden: true });
    await refreshIndex();
  });

  const checkCanEdit = async (docSelector: string, can = true) => {
    await expect(page).toClick('.item-document', {
      text: docSelector,
    });

    if (can) {
      await expect(page).toMatchElement('.metadata-sidepanel button.edit-metadata', {
        text: 'Edit',
      });
    } else {
      await expect(page).not.toMatchElement('.metadata-sidepanel button.edit-metadata', {
        text: 'Edit',
      });
    }
  };

  it('should be able to see and edit entities as a collaborator', async () => {
    await logout();
    await login('colla', 'borator');
    await goToRestrictedEntities();
    await expectDocumentCountAfterSearch(page, 3);
    const entities = await page.$$('.item-document');
    expect(entities.length).toBe(3);
    await checkCanEdit(titleEntity1, false);
    await checkCanEdit(titleEntity3);
    await checkCanEdit(titleEntity4);
  });

  it('should be able to edit a save', async () => {
    await expect(page).toClick('.item-document', {
      text: titleEntity4,
    });
    await expect(page).toClick('button', { text: 'Edit' });
    await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', 'Edited title');
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('div.alert', { text: 'Entity updated' });
    await page.waitFor('.item-document');
    await expect(page).toMatchElement('.item-document .item-info > div > span', {
      text: 'Edited title',
    });
  });

  it('should be able to see only published entities', async () => {
    await goToPublishedEntities();
    await page.waitFor('.item-document');
    await expect(page).toFill(
      'input[name="library.search.searchTerm"]',
      '"Resolución de la Corte IDH."'
    );
    await expect(page).toClick('[aria-label="Search button"]');
    await expect(page).toMatchElement('.item-document .item-info > .item-name > span', {
      text: titlePublic1,
    });
  });
});
