import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { TranslationDBO } from 'api/i18n.v2/schemas/TranslationDBO';
import { getIdMapper } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { MongoTranslationsSyncDataSource } from '../MongoTranslationsSyncDataSource';

const id = getIdMapper();

const fixtures: DBFixture = {
  translationsV2: [],
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],
};

const collectionInDb = (collection = 'translationsV2') =>
  testingDB.mongodb?.collection(collection)!;

const translation = (
  _id: ObjectId,
  value: string,
  key: string = 'key',
  language: LanguageISO6391 = 'es'
): TranslationDBO => ({
  _id,
  language,
  key,
  value,
  context: { type: 'Entity', label: 'label', id: 'id' },
});

const translationsInDb = async () => collectionInDb().find({}).sort({ _id: 1 }).toArray();

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);

  await testingDB
    .mongodb!.collection('translationsV2')
    .createIndex({ language: 1, key: 1, 'context.id': 1 }, { unique: true });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('MongoTranslationsSyncDataSource', () => {
  describe('save()', () => {
    it('should create a translations when does not exists', async () => {
      const transactionManager = DefaultTransactionManager();

      await new MongoTranslationsSyncDataSource(getConnection(), transactionManager).save(
        translation(id('value'), 'value')
      );

      expect(await translationsInDb()).toEqual([translation(id('value'), 'value')]);
    });

    it('should update translation when it does exists', async () => {
      const transactionManager = DefaultTransactionManager();

      await new MongoTranslationsSyncDataSource(getConnection(), transactionManager).save(
        translation(id('value'), 'value')
      );

      await new MongoTranslationsSyncDataSource(getConnection(), transactionManager).save(
        translation(id('value'), 'value updated')
      );

      expect(await translationsInDb()).toEqual([translation(id('value'), 'value updated')]);
    });
  });

  describe('saveMultiple()', () => {
    it('should create a translations when does not exists', async () => {
      const transactionManager = DefaultTransactionManager();

      await new MongoTranslationsSyncDataSource(getConnection(), transactionManager).saveMultiple([
        translation(id('value'), 'value'),
        translation(id('value 2'), 'value 2', 'key 2'),
      ]);

      expect(await translationsInDb()).toEqual([
        translation(id('value'), 'value'),
        translation(id('value 2'), 'value 2', 'key 2'),
      ]);
    });

    it('should update translation when it does exists', async () => {
      const transactionManager = DefaultTransactionManager();

      await new MongoTranslationsSyncDataSource(getConnection(), transactionManager).saveMultiple([
        translation(id('value'), 'value'),
      ]);

      await new MongoTranslationsSyncDataSource(getConnection(), transactionManager).saveMultiple([
        translation(id('value'), 'value updated'),
        translation(id('value 2'), 'value 2', 'key 2'),
      ]);

      expect(await translationsInDb()).toEqual([
        translation(id('value'), 'value updated'),
        translation(id('value 2'), 'value 2', 'key 2'),
      ]);
    });
  });

  describe('getById()', () => {
    it('should return the translation matching the _id', async () => {
      await testingEnvironment.setUp({
        ...fixtures,
        translationsV2: [translation(id('value'), 'value')],
      });

      const transactionManager = DefaultTransactionManager();

      const result = await new MongoTranslationsSyncDataSource(
        getConnection(),
        transactionManager
      ).getById(id('value').toString());

      expect(result).toEqual(translation(id('value'), 'value'));
    });
  });

  describe('delete', () => {
    it('should delete the translation matching the _id', async () => {
      await testingEnvironment.setUp({
        ...fixtures,
        translationsV2: [translation(id('value'), 'value')],
      });

      const transactionManager = DefaultTransactionManager();

      await new MongoTranslationsSyncDataSource(getConnection(), transactionManager).delete({
        _id: id('value').toString(),
      });

      expect(await translationsInDb()).toEqual([]);
    });
  });
});
