import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { GetTranslationsService } from '../GetTranslationsService';

const createService = () => {
  const transactionManager = new MongoTransactionManager(getClient());
  return new GetTranslationsService(DefaultTranslationsDataSource(transactionManager));
};

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;
const fixtures: DBFixture = {
  translationsV2: [
    createTranslationDBO('key1', 'value1', 'en', {
      type: 'Uwazi UI',
      label: 'label',
      id: 'context1',
    }),
    createTranslationDBO('key2', 'value2', 'en', {
      type: 'Uwazi UI',
      label: 'label',
      id: 'context1',
    }),
    createTranslationDBO('key3', 'value3', 'en', {
      type: 'Uwazi UI',
      label: 'label',
      id: 'context2',
    }),
    createTranslationDBO('key1', 'valor1', 'es', {
      type: 'Uwazi UI',
      label: 'label',
      id: 'context2',
    }),
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

describe('GetTranslationsService', () => {
  describe('getAll()', () => {
    it('should return all translations in the db', async () => {
      const service = createService();

      const allTranslations = service.getAll();

      expect(await allTranslations.all()).toEqual([
        {
          key: 'key1',
          value: 'value1',
          language: 'en',
          context: { type: 'Uwazi UI', label: 'label', id: 'context1' },
        },
        {
          key: 'key2',
          value: 'value2',
          language: 'en',
          context: { type: 'Uwazi UI', label: 'label', id: 'context1' },
        },
        {
          key: 'key3',
          value: 'value3',
          language: 'en',
          context: { type: 'Uwazi UI', label: 'label', id: 'context2' },
        },
        {
          key: 'key1',
          value: 'valor1',
          language: 'es',
          context: { type: 'Uwazi UI', label: 'label', id: 'context2' },
        },
      ]);
    });
  });

  describe('getByLanguage()', () => {
    it('should return all translations in the db', async () => {
      const allTranslations = createService().getByLanguage('en');

      expect(await allTranslations.all()).toMatchObject([
        { language: 'en' },
        { language: 'en' },
        { language: 'en' },
      ]);
    });
  });

  describe('getByContext()', () => {
    it('should return all translations in the db', async () => {
      const allTranslations = createService().getByContext('context1');

      expect(await allTranslations.all()).toMatchObject([
        { context: { type: 'Uwazi UI', label: 'label', id: 'context1' } },
        { context: { type: 'Uwazi UI', label: 'label', id: 'context1' } },
      ]);
    });
  });
});
