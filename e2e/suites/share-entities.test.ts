import insertFixtures from '../helpers/insertFixtures';
import proxyMock from '../helpers/proxyMock';
import { adminLogin } from '../helpers/login';
import { host } from '../config';

describe('Share entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await page.goto(`${host}`);
  });

  const openModalOfEntity = async (entitySelector: string) => {
    await expect(page).toClick(entitySelector);
    await expect(page).toClick('button', { text: 'Share' });
  };

  const getEntitiesCollaborators = async () =>
    page.$$eval('.members-list tr .member-list-item', items => items.map(item => item.textContent));

  it('Should list available collaborators of an entity', async () => {
    await openModalOfEntity('.item-document:nth-child(2)');
    await expect(page).toClick('.userGroupsLookupField');
    const availableCollaborators = await page.$$eval(
      '.userGroupsLookupField li .member-list-item',
      items => items.map(item => item.textContent)
    );
    expect(availableCollaborators).toEqual(['Activistas', 'Asesores legales']);
  });

  it('Should not return data form partial user match', async () => {
    await expect(page).toFill('.userGroupsLookupField', 'edit');
    const matchesCount = await page.$$eval(
      '.userGroupsLookupField li .member-list-item',
      items => items.length
    );
    expect(matchesCount).toBe(0);
  });

  it('Should update the permissions of an entity', async () => {
    await expect(page).toFill('.userGroupsLookupField', 'editor');
    await expect(page).toClick('.userGroupsLookupField li .member-list-item', { text: 'editor' });
    await expect(page).toFill('.userGroupsLookupField', 'Ase');
    await expect(page).toClick('.userGroupsLookupField li .member-list-item', {
      text: 'Asesores legales',
    });

    const selectedCollaborators = await getEntitiesCollaborators();
    expect(selectedCollaborators).toEqual(['editor', 'Asesores legales']);
    await expect(page).toSelect('select', 'Can edit');
    await expect(page).toClick('button', {
      text: 'Save changes',
    });
  });

  it('Should load saved permissions for each entity', async () => {
    await openModalOfEntity('.item-document:nth-child(1)');
    const loadedCollaborators = await getEntitiesCollaborators();
    expect(loadedCollaborators.length).toBe(0);
    await expect(page).toClick('button', { text: 'Close' });

    await openModalOfEntity('.item-document:nth-child(2)');
    await page.waitForSelector('.members-list tr');
    const savedCollaborators = await getEntitiesCollaborators();
    expect(savedCollaborators).toEqual(['Asesores legales', 'editor']);
    await expect(page).toMatchElement('.members-list tr:nth-child(1) select', {
      text: 'Can see',
    });
    await expect(page).toMatchElement('.members-list tr:nth-child(2) select', {
      text: 'Can edit',
    });

    await expect(page).toClick('button', { text: 'Close' });
  });

  it('Should open the share modal for multiple selection', async () => {
    await expect(page).toClick('button', { text: 'Select all' });
    await page.click('.multi-edit .share-btn');
    await page.waitForSelector('.members-list tr');
    const loadedCollaborators = await getEntitiesCollaborators();
    expect(loadedCollaborators).toEqual(['Asesores legales', 'editor']);
    await expect(page).toMatchElement('.members-list tr:nth-child(1) select', {
      text: 'Mixed access',
    });
    await expect(page).toMatchElement('.members-list tr:nth-child(2) select', {
      text: 'Mixed access',
    });
    await expect(page).toClick('button', { text: 'Close' });
  });
});
