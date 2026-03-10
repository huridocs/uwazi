import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { Translation } from 'api/i18n.v2/model/Translation';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { CachedMongoTranslationsDataSource } from '../CachedMongoTranslationsDataSource';

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;

const fixtures: DBFixture = {
  translationsV2: [
    createTranslationDBO('test_key_1', 'value 1', 'en', {
      type: 'Entity',
      label: 'Test Context',
      id: 'context1',
    }),
    createTranslationDBO('test_key_2', 'value 2', 'en', {
      type: 'Entity',
      label: 'Test Context',
      id: 'context1',
    }),
    createTranslationDBO('test_key_1', 'valor 1', 'es', {
      type: 'Entity',
      label: 'Test Context',
      id: 'context1',
    }),
    createTranslationDBO('other_key', 'other value', 'en', {
      type: 'Entity',
      label: 'Other Context',
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

  await testingDB
    .mongodb!.collection('translationsV2')
    .createIndex({ language: 1, key: 1, 'context.id': 1 }, { unique: true });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('CachedMongoTranslationsDataSource', () => {
  describe('getByContext()', () => {
    it('should cache the result on first call', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTranslationsDataSource(getConnection(), transactionManager);

      const resultSet1 = dataSource.getByContext('context1');
      const resultSet2 = dataSource.getByContext('context1');

      const all1 = await resultSet1.all();
      const all2 = await resultSet2.all();

      // Second call should return cached result
      expect(all1).toBe(all2);
      expect(all1).toHaveLength(3);
    });

    it('should clear cache after transaction commit', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTranslationsDataSource(getConnection(), transactionManager);

      const resultSet1 = dataSource.getByContext('context1');
      const all1 = await resultSet1.all();

      // Execute a transaction to trigger onCommitted handlers
      await transactionManager.run(async () => {
        // Transaction that would modify data
        await Promise.resolve();
      });

      const resultSet2 = dataSource.getByContext('context1');
      const all2 = await resultSet2.all();

      // After transaction commit, the cache should be cleared
      // so the results should be different instances
      expect(all1).not.toBe(all2);
      expect(all1).toHaveLength(3);
      expect(all2).toHaveLength(3);
    });

    it('should cache different contexts separately', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTranslationsDataSource(getConnection(), transactionManager);

      const resultSet1 = dataSource.getByContext('context1');
      const resultSet2 = dataSource.getByContext('context2');

      const all1 = await resultSet1.all();
      const all2 = await resultSet2.all();

      expect(all1).not.toBe(all2);
      expect(all1).toHaveLength(3);
      expect(all2).toHaveLength(1);
    });

    it('should return correct translation data from cache', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTranslationsDataSource(getConnection(), transactionManager);

      const resultSet = dataSource.getByContext('context1');
      const all = await resultSet.all();

      expect(all[0]).toBeInstanceOf(Translation);
      expect(all.some(t => t.key === 'test_key_1' && t.language === 'en')).toBe(true);
      expect(all.some(t => t.key === 'test_key_2' && t.language === 'en')).toBe(true);
      expect(all.some(t => t.key === 'test_key_1' && t.language === 'es')).toBe(true);
    });
  });
});
