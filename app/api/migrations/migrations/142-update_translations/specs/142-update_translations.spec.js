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

  it('should add the new keys and remove old ones', async () => {
    await migration.up(testingDB.mongodb);
    const updatedTranslations = await testingDB.mongodb.collection('translations').find().toArray();

    const expectedSystemTranslations = {
      ...system,
      values: [
        { key: 'Menu', value: 'Menu' },
        { key: 'Filters', value: 'Filters' },
        { key: 'Library', value: 'Library' },
        {
          key: 'We have started the language installation process, which may take time depending on the size of the collection. The languages will be available as it progresses.',
          value:
            'We have started the language installation process, which may take time depending on the size of the collection. The languages will be available as it progresses.',
        },
        {
          key: 'We have started the language deletion process, which may take time depending on the size of the collection. The languages will be removed as it progresses.',
          value:
            'We have started the language deletion process, which may take time depending on the size of the collection. The languages will be removed as it progresses.',
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
