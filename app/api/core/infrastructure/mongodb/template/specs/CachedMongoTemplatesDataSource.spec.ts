import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { CachedMongoTemplatesDataSource } from '../CachedMongoTemplatesDataSource';

const factory = getFixturesFactory();

const template1 = factory.template('Template 1');
const template2 = factory.template('Template 2');
const defaultTemplate = factory.template('Default Template', [], { default: true });

const fixtures: DBFixture = {
  templates: [template1, template2, defaultTemplate],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('CachedMongoTemplatesDataSource', () => {
  describe('getById()', () => {
    it('should cache the result on first call and return same instance on second call', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTemplatesDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getById(template1._id.toString());
      const result2 = await dataSource.getById(template1._id.toString());

      expect(result1).toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result1.getDataOrThrow().id).toBe(template1._id.toString());
    });

    it('should cache different templates separately', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTemplatesDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getById(template1._id.toString());
      const result2 = await dataSource.getById(template2._id.toString());

      expect(result1).not.toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      expect(result1.getDataOrThrow().id).toBe(template1._id.toString());
      expect(result2.getDataOrThrow().id).toBe(template2._id.toString());
    });

    it('should clear cache after transaction commit', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTemplatesDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getById(template1._id.toString());

      await transactionManager.run(async () => {
        await Promise.resolve();
      });

      const result2 = await dataSource.getById(template1._id.toString());

      expect(result1).not.toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      expect(result1.getDataOrThrow().id).toBe(template1._id.toString());
      expect(result2.getDataOrThrow().id).toBe(template1._id.toString());
    });

    it('should not cache errors for non-existent templates', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTemplatesDataSource(getConnection(), transactionManager);

      const nonExistentId = factory.id('nonexistent').toString();

      const result1 = await dataSource.getById(nonExistentId);
      expect(result1.isError()).toBe(true);

      const result2 = await dataSource.getById(nonExistentId);
      expect(result2.isError()).toBe(true);

      expect(result1).not.toBe(result2);
    });
  });

  describe('getDefaultTemplate()', () => {
    it('should cache default template on first call', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTemplatesDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getDefaultTemplate();
      const result2 = await dataSource.getDefaultTemplate();

      expect(result1).toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result1.getDataOrThrow().id).toBe(defaultTemplate._id.toString());
    });

    it('should clear default template cache after transaction commit', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTemplatesDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getDefaultTemplate();

      await transactionManager.run(async () => {
        await Promise.resolve();
      });

      const result2 = await dataSource.getDefaultTemplate();

      expect(result1).not.toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      expect(result1.getDataOrThrow().id).toBe(defaultTemplate._id.toString());
      expect(result2.getDataOrThrow().id).toBe(defaultTemplate._id.toString());
    });

    it('should cache default template separately from regular templates', async () => {
      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTemplatesDataSource(getConnection(), transactionManager);

      const defaultResult = await dataSource.getDefaultTemplate();
      const byIdResult = await dataSource.getById(defaultTemplate._id.toString());

      expect(defaultResult.isOk()).toBe(true);
      expect(byIdResult.isOk()).toBe(true);

      expect(defaultResult.getDataOrThrow().id).toBe(byIdResult.getDataOrThrow().id);
    });

    it('should not cache errors when no default template exists', async () => {
      await testingEnvironment.setUp({
        templates: [template1, template2],
      });

      const transactionManager = TransactionManagerFactory.default();
      const dataSource = new CachedMongoTemplatesDataSource(getConnection(), transactionManager);

      const result1 = await dataSource.getDefaultTemplate();
      expect(result1.isError()).toBe(true);

      const result2 = await dataSource.getDefaultTemplate();
      expect(result2.isError()).toBe(true);

      expect(result1).not.toBe(result2);
    });
  });
});
