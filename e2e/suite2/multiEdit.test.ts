/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/*global page*/

import { adminLogin, logout } from '../helpers/login.js';
import proxyMock from '../helpers/proxyMock.js';
import insertFixtures from '../helpers/insertFixtures.js';
import { refreshIndex } from '../helpers/elastichelpers.js';

describe('multi edit', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  afterAll(async () => {
    await logout();
  });

  const selectLookupOption = async (searchTerm: string, option: string) => {
    await expect(page).toFill('.userGroupsLookupField input', searchTerm);
    await page.waitForSelector('.userGroupsLookupField li .press-enter-note');
    await expect(page).toClick('.userGroupsLookupField li .member-list-item', {
      text: option,
    });
    await expect(page).toClick('button', { text: 'Save changes' });
    await page.waitForNetworkIdle();
    await refreshIndex();
  };

  const createEntity = async (title: string, type: string) => {
    await expect(page).toClick('button', { text: 'Create entity' });
    await page.waitForTimeout(2000);
    await expect(page).toFill('#metadataForm textarea:first-child', title);
    await expect(page).toSelect('#metadataForm select:first-child', type);
    await expect(page).toClick('button', { text: 'Save' });
    await page.waitForNetworkIdle();
    await expect(page).toClick('button.close-modal');
  };

  const selectFromLibrary = async (title: string) => {
    await expect(page).toClick('.item-info', { text: title });
    return {
      async shiftSelectUntil(toTitle: string) {
        await page.keyboard.down('Shift');
        await expect(page).toClick('.item-info', { text: toTitle });
        await page.keyboard.up('Shift');
      },
      async controlSelect(titles: string[]) {
        await page.keyboard.down('Control');
        for (const toTitle of titles) {
          await expect(page).toClick('.item-info', { text: toTitle });
        }
        await page.keyboard.up('Control');
      },
    };
  };

  const reloadLibrary = async () => {
    await expect(page).toClick('label', { text: 'Restricted' });
    await page.waitForNetworkIdle();
    await expect(page).toClick('label', { text: 'Restricted' });
    await page.waitForNetworkIdle();
  };

  const expectValues = async (title: string, values: string[]) => {
    await selectFromLibrary(title);
    for (const value of values) {
      await expect(page).toMatch(value);
    }
  };

  const multiEdit = async (range: { from: string; to: string }, countries: string[]) => {
    await (await selectFromLibrary(range.from)).shiftSelectUntil(range.to);
    await expect(page).toClick('.multi-edit button', { text: 'Edit' });

    for (const country of countries) {
      await expect(page).toClick('label', { text: country });
    }

    await expect(page).toClick('.multi-edit button', { text: 'Save' });
    await page.waitForNetworkIdle();
  };

  it('should create 3 entities', async () => {
    await createEntity('A case', 'Causa');
    await createEntity('A sentence', 'Sentencia de la corte');
    await createEntity('Another sentence', 'Sentencia de la corte');
  });

  it('should edit the 3 entities with a single multiEdit action', async () => {
    await multiEdit({ from: 'Another sentence', to: 'A case' }, ['Argentina', 'Bahamas']);

    await expectValues('A sentence', ['ArgentinaBahamas']);
    await expectValues('Another sentence', ['ArgentinaBahamas']);
    await expectValues('A case', ['ArgentinaBahamas']);
  });

  it('should publish the entities', async () => {
    await (await selectFromLibrary('Another sentence')).shiftSelectUntil('A case');
    await expect(page).toClick('.multi-edit button', { text: 'Share' });
    await selectLookupOption('public', 'Public');
    await expect(page).toClick('.multi-edit button.close-modal');
    await expect(page).toClick('label', { text: 'Restricted' });
    await page.waitForNetworkIdle();
    await (await selectFromLibrary('Another sentence')).shiftSelectUntil('A case');

    await expect(page).toMatch('3 selected');
    await expect(page).toClick('.multi-edit button.close-modal');
  });

  describe('holding control', () => {
    it('should select individual items and display a list', async () => {
      await (await selectFromLibrary('A sentence')).controlSelect(['Another sentence', 'A case']);

      await expect(page).toMatch('3 selected');
      await expect(page).toClick('.multi-edit button.close-modal');
    });
  });

  describe('when editing same type', () => {
    it('should only update modified values', async () => {
      await (await selectFromLibrary('A sentence')).controlSelect(['Another sentence']);

      await expect(page).toClick('.multi-edit button', { text: 'Edit' });
      await expect(page).toFill(
        'input[name="library.sidepanel.multipleEdit.metadata.n_mero"]',
        'edited value'
      );

      await expect(page).toClick('.multi-edit button', { text: 'Save' });
      await page.waitForNetworkIdle();

      await expectValues('A sentence', ['edited value', 'ArgentinaBahamas']);
      await expectValues('Another sentence', ['edited value', 'ArgentinaBahamas']);
    });
  });

  describe('deleting', () => {
    it('should delete multiple items at once after confirm', async () => {
      await (await selectFromLibrary('Another sentence')).shiftSelectUntil('A case');
      await expect(page).toClick('.multi-edit button', { text: 'Delete' });
      await expect(page).toClick('button', { text: 'Accept' });
      await page.waitForNetworkIdle();

      await reloadLibrary();

      await expect(page).not.toMatch('Another Sentence');
      await expect(page).not.toMatch('A sentence');
      await expect(page).not.toMatch('A case');
    });
  });
});
