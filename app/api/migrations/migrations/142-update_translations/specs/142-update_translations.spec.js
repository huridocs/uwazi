import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { translations, thesauri, system } from './fixtures.js';

describe('migration to update translations adding new keys and removing old ones', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext({ translations });
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(142);
  });

  it('should add the new keys and remove old ones, if needed', async () => {
    await migration.up(testingDB.mongodb);
    const updatedTranslations = await testingDB.mongodb.collection('translations').find().toArray();

    const expectedSystemTranslations = {
      ...system,
      values: [
        { key: 'Menu', value: 'Menu' },
        { key: 'Filters', value: 'Filters' },
        { key: 'Library', value: 'Library' },
        {
          key: 'Languages installed successfully',
          value: 'Languages installed successfully',
        },
        {
          key: 'Language Install Start Message',
          value:
            'Language installation process initiated. It may take several minutes to complete depending on the size of the collection. Please wait until the installation process is finished.',
        },
        {
          key: 'Language Uninstall Start Message',
          value:
            'Language uninstallation process initiated. It may take several minutes to complete depending on the size of the collection.  Please wait until the uninstallation process is finished.',
        },
        {
          key: 'An error has occured while installing languages:',
          value: 'An error has occured while installing languages:',
        },
        {
          key: 'An error has occured while deleting a language:',
          value: 'An error has occured while deleting a language:',
        },
        {
          key: 'Language uninstalled successfully',
          value: 'Language uninstalled successfully',
        },
      ],
    };

    expect(updatedTranslations).toMatchObject([
      expect.objectContaining({
        locale: 'en',
        contexts: [expectedSystemTranslations, thesauri],
      }),
      expect.objectContaining({
        locale: 'es',
        contexts: [expectedSystemTranslations, thesauri],
      }),
      expect.objectContaining({
        locale: 'fr',
        contexts: [expectedSystemTranslations, thesauri],
      }),
    ]);
  });
});
