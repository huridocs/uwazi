import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove-duplicate-translation-keys', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    migration.reindex = false;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(76);
  });

  it('should remove multiple keys and keep correct values in all languages, in all contexts', async () => {
    await testingDB.clearAllAndLoad(fixtures);
    const expectedSystemValues = [
      { key: 'Password', value: 'Password' },
      { key: 'Account', value: 'Account' },
      { key: 'Email', value: 'E-Mail' },
      { key: 'Age', value: 'Age' },
    ];
    const expectedDictValues = [
      { key: 'unique_key', value: 'unique_key' },
      { key: 'duplicate_key', value: 'duplicate_key' },
      { key: 'multiple_key_with_tr', value: 'pick this one' },
    ];
    await migration.up(testingDB.mongodb);
    const translations = await testingDB.mongodb.collection('translations').find({}).toArray();
    translations.forEach(tr => {
      const systemValues = tr.contexts[0].values;
      expect(systemValues).toMatchObject(expectedSystemValues);
      const dictValues = tr.contexts[1].values;
      expect(dictValues).toMatchObject(expectedDictValues);
    });
  });

  it('should reindex if there are removed keys', async () => {
    await testingDB.clearAllAndLoad(fixtures);
    await migration.up(testingDB.mongodb);
    expect(migration.reindex).toBe(true);
  });

  it('should not reindex if nothing is changing', async () => {
    await testingDB.clearAllAndLoad({
      translations: [
        {
          locale: 'en',
          contexts: [
            {
              label: 'System',
              type: 'Uwazi UI',
              id: 'System',
              values: [
                { key: 'Password', value: 'Password' },
                { key: 'Account', value: 'Account' },
                { key: 'Email', value: 'E-Mail' },
                { key: 'Age', value: 'Age' },
              ],
            },
          ],
        },
      ],
    });
    await migration.up(testingDB.mongodb);
    expect(migration.reindex).toBe(false);
  });
});
