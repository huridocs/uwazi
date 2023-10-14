import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DeleteTranslationsService } from '../DeleteTranslationsService';

const collectionInDb = (collection = 'translationsV2') =>
  testingDB.mongodb?.collection(collection)!;

const createService = () => {
  const transactionManager = DefaultTransactionManager();
  return new DeleteTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    transactionManager
  );
};

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;
const fixtures: DBFixture = {
  translationsV2: [
    createTranslationDBO('clave', 'valor', 'es', {
      type: 'Uwazi UI',
      label: 'Test',
      id: 'context1',
    }),
    createTranslationDBO('key', 'value', 'en', { type: 'Uwazi UI', label: 'Test', id: 'context1' }),
    createTranslationDBO('clave', 'valor', 'es', {
      type: 'Uwazi UI',
      label: 'Test',
      id: 'context2',
    }),
    createTranslationDBO('key', 'value', 'en', { type: 'Uwazi UI', label: 'Test', id: 'context2' }),
    createTranslationDBO('clave', 'valor', 'es', {
      type: 'Uwazi UI',
      label: 'Test',
      id: 'context3',
    }),
    createTranslationDBO('key', 'value', 'en', { type: 'Uwazi UI', label: 'Test', id: 'context3' }),
  ],
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('DeleteTranslationsService', () => {
  describe('deleteByContext()', () => {
    it('should delete all translations for a particular context', async () => {
      await createService().deleteByContextId('context2');

      const translationsInDb = await collectionInDb()
        .find({}, { projection: { _id: 0 } })
        .sort({ _id: 1 })
        .toArray();

      expect(translationsInDb).toMatchObject([
        {
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'Uwazi UI', label: 'Test', id: 'context1' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'Uwazi UI', label: 'Test', id: 'context1' },
        },
        {
          language: 'es',
          key: 'clave',
          value: 'valor',
          context: { type: 'Uwazi UI', label: 'Test', id: 'context3' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'Uwazi UI', label: 'Test', id: 'context3' },
        },
      ]);
    });
  });

  describe('deleteByLanguage', () => {
    it('should delete all translations for a particular context', async () => {
      await createService().deleteByLanguage('es');

      const translationsInDb = await collectionInDb()
        .find({}, { projection: { _id: 0 } })
        .sort({ _id: 1 })
        .toArray();

      expect(translationsInDb).toMatchObject([
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'Uwazi UI', label: 'Test', id: 'context1' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'Uwazi UI', label: 'Test', id: 'context2' },
        },
        {
          language: 'en',
          key: 'key',
          value: 'value',
          context: { type: 'Uwazi UI', label: 'Test', id: 'context3' },
        },
      ]);
    });
  });
});
