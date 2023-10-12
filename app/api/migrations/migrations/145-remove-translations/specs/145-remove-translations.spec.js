import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove-obsolete-translation-keys', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    migration.reindex = false;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(145);
  });

  it('should remove the obsoletes keys in all languages', async () => {
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);
    const translations = await testingDB.mongodb.collection('translations').find({}).toArray();

    translations.forEach(language => {
      const systemValues = language.contexts[0].values;
      const thesauriValues = language.contexts[1].values;

      expect(systemValues).toMatchObject([
        { key: 'Menu', value: 'Menu' },
        { key: 'Filters', value: 'Filters' },
        { key: 'Library', value: 'Library' },
      ]);

      expect(thesauriValues).toMatchObject([
        { key: 'red', value: 'Red' },
        { key: 'green', value: 'Green' },
        { key: 'blue', value: 'Blue' },
      ]);
    });
  });
});
