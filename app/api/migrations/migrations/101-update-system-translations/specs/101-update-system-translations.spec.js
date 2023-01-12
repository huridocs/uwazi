import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

const expectedTranslations = {
  en: [
    { key: 'Filters', value: 'Filters' },
    { key: 'Library', value: 'Library' },
    {
      key: 'Create relationships and references',
      value: 'Create relationships and references',
    },
    { key: 'relationships', value: 'relationships' },
  ],
  es: [
    { key: 'Filters', value: 'Filtros' },
    { key: 'Library', value: 'Biblioteca' },
    {
      key: 'Create relationships and references',
      value: 'Crear conecciones y referencias',
    },
    { key: 'relationships', value: 'conexiones' },
  ],
  fr: [
    { key: 'Filters', value: 'Filtres' },
    { key: 'Library', value: 'Bibliothèque' },
    {
      key: 'Create relationships and references',
      value: 'Create relationships and references',
    },
    { key: 'relationships', value: 'relationships' },
  ],
};

describe('migration remove-obsolete-translation-keys', () => {
  let translations;

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);
    translations = await testingDB.mongodb.collection('translations').find({}).toArray();
  });

  beforeEach(async () => {
    migration.reindex = false;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(101);
  });

  it('should update the keys and untranslated values in all languages', () => {
    translations.forEach(language => {
      const systemValues = language.contexts[0].values;
      const thesauriValues = language.contexts[1].values;

      const expectedSystemTranslations = expectedTranslations[language.locale];

      expect(systemValues).toMatchObject(expectedSystemTranslations);

      expect(thesauriValues).toMatchObject([
        { key: 'red', value: 'Red' },
        { key: 'green', value: 'Green' },
        { key: 'blue', value: 'Blue' },
      ]);
    });
  });
});
