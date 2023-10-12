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

  it('should remove the obsoletes keys in all languages for V2 translations', async () => {
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);
    const translations = await testingDB.mongodb.collection('translationsV2').find({}).toArray();

    expect(translations).toMatchObject([
      {
        language: 'en',
        key: 'Library',
        value: 'Library',
        context: {
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
        },
      },
      {
        language: 'es',
        key: 'Library',
        value: 'Biblioteca',
        context: {
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
        },
      },
      {
        language: 'en',
        key: 'New password',
        value: 'New password',
        context: {
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
        },
      },
      {
        language: 'es',
        key: 'New password',
        value: 'Nueva contraseña',
        context: {
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
        },
      },
    ]);
  });
});
