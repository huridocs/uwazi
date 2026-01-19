import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { CachedMongoThesauriDataSource } from '../CachedMongoThesauriDataSource';

const fixtures: DBFixture = {
  dictionaries: [
    {
      _id: new ObjectId('507f1f77bcf86cd799439011'),
      name: 'Test Thesaurus',
      values: [
        { id: 'value1', label: 'Value 1' },
        { id: 'value2', label: 'Value 2' },
      ],
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

describe('CachedMongoThesauriDataSource', () => {
  describe('getById()', () => {
    it('should cache the result on first call', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoThesauriDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getById('507f1f77bcf86cd799439011');
      const result2 = await dataSource.getById('507f1f77bcf86cd799439011');

      expect(result1).toBe(result2);
      expect(result1.isOk()).toBe(true);
      if (result1.isOk()) {
        expect(result1.data.name).toBe('Test Thesaurus');
      }
    });

    it('should clear cache after transaction commit', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoThesauriDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getById('507f1f77bcf86cd799439011');

      // Execute a transaction to trigger onCommitted handlers
      await transactionManager.run(async () => {
        // Transaction that would modify data
        await Promise.resolve();
      });

      const result2 = await dataSource.getById('507f1f77bcf86cd799439011');

      // After transaction commit, the cache should be cleared
      // so the results should be different instances
      expect(result1).not.toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
    });

    it('should cache different IDs separately', async () => {
      const fixtures2 = {
        ...fixtures,
        dictionaries: [
          ...(fixtures.dictionaries || []),
          {
            _id: new ObjectId('507f1f77bcf86cd799439012'),
            name: 'Another Thesaurus',
            values: [],
          },
        ],
      };

      await testingEnvironment.setUp(fixtures2);

      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoThesauriDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getById('507f1f77bcf86cd799439011');
      const result2 = await dataSource.getById('507f1f77bcf86cd799439012');

      expect(result1).not.toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.data.name).toBe('Test Thesaurus');
        expect(result2.data.name).toBe('Another Thesaurus');
      }
    });
  });
});
