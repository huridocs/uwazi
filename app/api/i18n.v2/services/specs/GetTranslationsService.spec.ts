import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoTranslationsDataSource } from '../../database/MongoTranslationsDataSource';
import { GetTranslationsService } from '../GetTranslationsService';

const createService = () =>
  new GetTranslationsService(
    new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient()))
  );

const fixtures = {
  translations_v2: [
    {
      key: 'key1',
      value: 'value1',
      language: 'en',
      context: { type: 'type', label: 'label', id: 'context1' },
    },
    {
      key: 'key2',
      value: 'value2',
      language: 'en',
      context: { type: 'type', label: 'label', id: 'context1' },
    },
    {
      key: 'key3',
      value: 'value3',
      language: 'en',
      context: { type: 'type', label: 'label', id: 'context2' },
    },
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

describe('getAll()', () => {
  it('should return all translations in the db', async () => {
    const service = createService();

    const allTranslations = service.getAll();

    expect(await allTranslations.all()).toEqual([
      {
        key: 'key1',
        value: 'value1',
        language: 'en',
        context: { type: 'type', label: 'label', id: 'context1' },
      },
      {
        key: 'key2',
        value: 'value2',
        language: 'en',
        context: { type: 'type', label: 'label', id: 'context1' },
      },
      {
        key: 'key3',
        value: 'value3',
        language: 'en',
        context: { type: 'type', label: 'label', id: 'context2' },
      },
    ]);
  });
});
