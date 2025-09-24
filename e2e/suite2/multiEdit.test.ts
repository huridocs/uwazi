/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { refreshIndex } from '../helpers/elastichelpers';

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
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toFill('.userGroupsLookupField input', searchTerm);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForSelector('.userGroupsLookupField li .press-enter-note');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.userGroupsLookupField li .member-list-item', {
      text: option,
    });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('button', { text: 'Save changes' });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.alert.alert-success');
    await refreshIndex();
  };

  const createEntity = async (title: string, type: string) => {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('button', { text: 'Create entity' });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForTimeout(2000);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toFill('#metadataForm textarea:first-child', title);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toSelect('#metadataForm select:first-child', type);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('button', { text: 'Save' });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.alert.alert-success');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('button.close-modal');
  };

  const selectFromLibrary = async (title: string) => {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.item-info', { text: title });
    return {
      async shiftSelectUntil(toTitle: string) {
        // @ts-expect-error TS(2304): Cannot find name 'page'.
        await page.keyboard.down('Shift');
        // @ts-expect-error TS(2304): Cannot find name 'page'.
        await expect(page).toClick('.item-info', { text: toTitle });
        // @ts-expect-error TS(2304): Cannot find name 'page'.
        await page.keyboard.up('Shift');
      },
      async controlSelect(titles: string[]) {
        // @ts-expect-error TS(2304): Cannot find name 'page'.
        await page.keyboard.down('Control');
        for (const toTitle of titles) {
          // @ts-expect-error TS(2304): Cannot find name 'page'.
          await expect(page).toClick('.item-info', { text: toTitle });
        }
        // @ts-expect-error TS(2304): Cannot find name 'page'.
        await page.keyboard.up('Control');
      },
    };
  };

  const reloadLibrary = async () => {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('label', { text: 'Restricted' });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNetworkIdle();
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('label', { text: 'Restricted' });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNetworkIdle();
  };

  const expectValues = async (title: string, values: string[]) => {
    await selectFromLibrary(title);
    for (const value of values) {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatch(value);
    }
  };

  const multiEdit = async (range: { from: string; to: string }, countries: string[]) => {
    await (await selectFromLibrary(range.from)).shiftSelectUntil(range.to);
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.multi-edit button', { text: 'Edit' });

    for (const country of countries) {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('label', { text: country });
    }

    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.multi-edit button', { text: 'Save' });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.alert.alert-success');
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
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.multi-edit button', { text: 'Share' });
    await selectLookupOption('public', 'Public');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.multi-edit button.close-modal');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('label', { text: 'Restricted' });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForNetworkIdle();
    await (await selectFromLibrary('Another sentence')).shiftSelectUntil('A case');

    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toMatch('3 selected');
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.multi-edit button.close-modal');
  });

  describe('holding control', () => {
    it('should select individual items and display a list', async () => {
      await (await selectFromLibrary('A sentence')).controlSelect(['Another sentence', 'A case']);

      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatch('3 selected');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.multi-edit button.close-modal');
    });
  });

  describe('when editing same type', () => {
    it('should only update modified values', async () => {
      await (await selectFromLibrary('A sentence')).controlSelect(['Another sentence']);

      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.multi-edit button', { text: 'Edit' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toFill(
        'input[name="library.sidepanel.multipleEdit.metadata.n_mero"]',
        'edited value'
      );

      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.multi-edit button', { text: 'Save' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.alert.alert-success');

      await expectValues('A sentence', ['edited value', 'ArgentinaBahamas']);
      await expectValues('Another sentence', ['edited value', 'ArgentinaBahamas']);
    });
  });

  describe('deleting', () => {
    it('should delete multiple items at once after confirm', async () => {
      await (await selectFromLibrary('Another sentence')).shiftSelectUntil('A case');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.multi-edit button', { text: 'Delete' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('button', { text: 'Accept' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.alert.alert-success');

      await reloadLibrary();

      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).not.toMatch('Another Sentence');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).not.toMatch('A sentence');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).not.toMatch('A case');
    });
  });
});
