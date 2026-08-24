import { ObjectId } from 'mongodb';
import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { PostgresTranslationsSyncHandler } from '../PostgresTranslationsSyncHandler.js';
import { TranslationsSyncHandlerFactory } from '../TranslationsSyncHandlerFactory.js';
import { MongoTranslationsSyncHandler } from '../MongoTranslationsSyncHandler.js';

const context = { type: 'Uwazi UI' as const, label: 'User Interface', id: 'System' };

describe('PostgresTranslationsSyncHandler', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const createHandler = () => {
    const tenantName = tenants.current().name;
    return new PostgresTranslationsSyncHandler({
      tenantId: tenantName,
      mongoDb: getConnection(),
      pgTransactionManager: new PostgresTransactionManager(
        PostgresDB.knex,
        tenantName,
        LoggerFactory.forTests()
      ),
    });
  };

  beforeEach(async () => {
    await testingPG.clear(['translations']);
  });

  it('should delete by natural key then insert on save', async () => {
    const handler = createHandler();
    const oldId = new ObjectId().toHexString();
    const newId = new ObjectId().toHexString();

    await testingPG.setFixtures({
      translations: [
        {
          _id: oldId,
          language: 'en',
          key: 'Search',
          value: 'Old',
          context_id: context.id,
          context_type: context.type,
          context_label: context.label,
        },
      ],
    });

    await handler.save({
      _id: newId,
      language: 'en',
      key: 'Search',
      value: 'New',
      context,
    });

    const rows = await testingPG.getAllFrom('translations');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: newId,
      language: 'en',
      key: 'Search',
      value: 'New',
      context_id: 'System',
    });
  });

  it('should delete a translation by id', async () => {
    const handler = createHandler();
    const id = new ObjectId().toHexString();

    await testingPG.setFixtures({
      translations: [
        {
          _id: id,
          language: 'en',
          key: 'Search',
          value: 'Search',
          context_id: context.id,
          context_type: context.type,
          context_label: context.label,
        },
      ],
    });

    await handler.delete(id);

    expect(await handler.getById(id)).toBeNull();
  });

  describe('TranslationsSyncHandlerFactory', () => {
    it('should return mongo handler when postgres flag is off', () => {
      const sut = testingEnvironment.runWithContext(() => TranslationsSyncHandlerFactory.default());

      expect(sut).toBeInstanceOf(MongoTranslationsSyncHandler);
    });

    it('should return postgres handler when postgres flag is on', () => {
      const sut = testingEnvironment.runWithContext(
        () => TranslationsSyncHandlerFactory.default(),
        {
          tenant: {
            ...testingTenants.current(),
            featureFlags: { postgresTranslations: true },
          },
        }
      );

      expect(sut).toBeInstanceOf(PostgresTranslationsSyncHandler);
    });
  });
});
