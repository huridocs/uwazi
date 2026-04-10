import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { SlotsReconciler } from '#api/core/infrastructure/elasticSearch/entities/SlotsReconciler.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { CachedMongoTemplatesDataSource } from '../CachedMongoTemplatesDataSource.js';
import { EntityIndexerService } from '#api/core/infrastructure/elasticSearch/entities/EntityIndexerService.js';

const factory = getFixturesFactory();

const template1 = factory.template('Template 1');
const template2 = factory.template('Template 2');
const defaultTemplate = factory.template('Default Template', [], { default: true });

const fixtures: DBFixture = {
  templates: [template1, template2, defaultTemplate],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const sut = new CachedMongoTemplatesDataSource({
    db: getConnection(),
    transactionManager,
    slotsReconciler: TestUtils.mockClass<SlotsReconciler>({ execute: jest.fn() }),
    entityIndexerService: TestUtils.mockClass<EntityIndexerService>({
      index: jest.fn(),
      deleteBySharedIds: jest.fn(),
      deleteByTemplateIds: jest.fn(),
    }),
  });

  return { sut, transactionManager };
};

describe('CachedMongoTemplatesDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getById()', () => {
    it('should cache the result on first call and return same instance on second call', async () => {
      const { sut } = createSut();

      const result1 = await sut.getById(template1._id.toString());
      const result2 = await sut.getById(template1._id.toString());

      expect(result1).toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result1.getDataOrThrow().id).toBe(template1._id.toString());
    });

    it('should cache different templates separately', async () => {
      const { sut } = createSut();

      const result1 = await sut.getById(template1._id.toString());
      const result2 = await sut.getById(template2._id.toString());

      expect(result1).not.toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      expect(result1.getDataOrThrow().id).toBe(template1._id.toString());
      expect(result2.getDataOrThrow().id).toBe(template2._id.toString());
    });

    it('should clear cache after transaction commit', async () => {
      const { sut, transactionManager } = createSut();

      const result1 = await sut.getById(template1._id.toString());

      await transactionManager.run(async () => {
        await Promise.resolve();
      });

      const result2 = await sut.getById(template1._id.toString());

      expect(result1).not.toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      expect(result1.getDataOrThrow().id).toBe(template1._id.toString());
      expect(result2.getDataOrThrow().id).toBe(template1._id.toString());
    });

    it('should not cache errors for non-existent templates', async () => {
      const { sut } = createSut();

      const nonExistentId = factory.id('nonexistent').toString();

      const result1 = await sut.getById(nonExistentId);
      expect(result1.isError()).toBe(true);

      const result2 = await sut.getById(nonExistentId);
      expect(result2.isError()).toBe(true);

      expect(result1).not.toBe(result2);
    });
  });

  describe('getDefaultTemplate()', () => {
    it('should cache default template on first call', async () => {
      const { sut } = createSut();

      const result1 = await sut.getDefaultTemplate();
      const result2 = await sut.getDefaultTemplate();

      expect(result1).toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result1.getDataOrThrow().id).toBe(defaultTemplate._id.toString());
    });

    it('should clear default template cache after transaction commit', async () => {
      const { sut, transactionManager } = createSut();

      const result1 = await sut.getDefaultTemplate();

      await transactionManager.run(async () => {
        await Promise.resolve();
      });

      const result2 = await sut.getDefaultTemplate();

      expect(result1).not.toBe(result2);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      expect(result1.getDataOrThrow().id).toBe(defaultTemplate._id.toString());
      expect(result2.getDataOrThrow().id).toBe(defaultTemplate._id.toString());
    });

    it('should cache default template separately from regular templates', async () => {
      const { sut } = createSut();

      const defaultResult = await sut.getDefaultTemplate();
      const byIdResult = await sut.getById(defaultTemplate._id.toString());

      expect(defaultResult.isOk()).toBe(true);
      expect(byIdResult.isOk()).toBe(true);

      expect(defaultResult.getDataOrThrow().id).toBe(byIdResult.getDataOrThrow().id);
    });

    it('should not cache errors when no default template exists', async () => {
      await testingEnvironment.setUp({
        templates: [template1, template2],
      });

      const { sut } = createSut();

      const result1 = await sut.getDefaultTemplate();
      expect(result1.isError()).toBe(true);

      const result2 = await sut.getDefaultTemplate();
      expect(result2.isError()).toBe(true);

      expect(result1).not.toBe(result2);
    });
  });
});
