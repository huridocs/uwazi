import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import { CachedMongoTranslationsDataSource } from '../CachedMongoTranslationsDataSource.js';

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

      const all1 = await dataSource.getByContext('context1');
      const all2 = await dataSource.getByContext('context1');

      expect(all1).toBe(all2);
      expect(all1).toHaveLength(3);
    });

    it('should clear cache after transaction commit', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTranslationsDataSource(getConnection(), transactionManager);

      const all1 = await dataSource.getByContext('context1');

      await transactionManager.run(async () => {
        await Promise.resolve();
      });

      const all2 = await dataSource.getByContext('context1');

      expect(all1).not.toBe(all2);
      expect(all1).toHaveLength(3);
      expect(all2).toHaveLength(3);
    });

    it('should cache different contexts separately', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTranslationsDataSource(getConnection(), transactionManager);

      const all1 = await dataSource.getByContext('context1');
      const all2 = await dataSource.getByContext('context2');

      expect(all1).not.toBe(all2);
      expect(all1).toHaveLength(3);
      expect(all2).toHaveLength(1);
    });

    it('should cache language+context queries separately from full context', async () => {
      const dataSource = new CachedMongoTranslationsDataSource(
        getConnection(),
        TransactionManagerFactory.default()
      );

      const byLanguageAndContext = await dataSource.getByLanguageAndContext('en', 'context1');
      const byContext = await dataSource.getByContext('context1');

      expect(byLanguageAndContext).toHaveLength(2);
      expect(byContext).toHaveLength(3);
      expect(byLanguageAndContext.every(t => t.language === 'en')).toBe(true);
    });

    it('should return correct translation data from cache', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTranslationsDataSource(getConnection(), transactionManager);

      const all = await dataSource.getByContext('context1');

      expect(all[0]).toBeInstanceOf(Translation);
      expect(all.some(t => t.key === 'test_key_1' && t.language === 'en')).toBe(true);
      expect(all.some(t => t.key === 'test_key_2' && t.language === 'en')).toBe(true);
      expect(all.some(t => t.key === 'test_key_1' && t.language === 'es')).toBe(true);
    });
  });
});
