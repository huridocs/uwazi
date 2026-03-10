import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { CachedMongoSettingsDataSource } from '../CachedMongoSettingsDataSource';

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
        { label: 'French', key: 'fr' },
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

describe('CachedMongoSettingsDataSource', () => {
  describe('getLanguageKeys()', () => {
    it('should cache the result on first call', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoSettingsDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getLanguageKeys();
      const result2 = await dataSource.getLanguageKeys();

      // Second call should return cached result
      expect(result1).toBe(result2);
      expect(result1).toEqual(['en', 'es', 'fr']);
    });

    it('should clear cache after transaction commit', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoSettingsDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getLanguageKeys();

      // Execute a transaction to trigger onCommitted handlers
      await transactionManager.run(async () => {
        // Transaction that would modify data
        await Promise.resolve();
      });

      const result2 = await dataSource.getLanguageKeys();

      // After transaction commit, the cache should be cleared
      // so the results should be different instances
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(['en', 'es', 'fr']);
      expect(result2).toEqual(['en', 'es', 'fr']);
    });

    it('should return correct language keys from cache', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoSettingsDataSource(getConnection(), transactionManager);

      const result = await dataSource.getLanguageKeys();

      expect(result).toHaveLength(3);
      expect(result).toContain('en');
      expect(result).toContain('es');
      expect(result).toContain('fr');
    });

    it('should return empty array when no languages are configured', async () => {
      await testingEnvironment.setUp({
        settings: [
          {
            languages: [],
          },
        ],
      });

      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoSettingsDataSource(getConnection(), transactionManager);

      const result = await dataSource.getLanguageKeys();

      expect(result).toEqual([]);
    });
  });
});
