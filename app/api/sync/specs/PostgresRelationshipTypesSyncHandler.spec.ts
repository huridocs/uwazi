import { ObjectId } from 'mongodb';
import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { PostgresRelationshipTypesSyncHandler } from '../PostgresRelationshipTypesSyncHandler.js';
import { RelationshipTypesSyncHandlerFactory } from '../RelationshipTypesSyncHandlerFactory.js';
import { MongoRelationshipTypesSyncHandler } from '../MongoRelationshipTypesSyncHandler.js';

describe('PostgresRelationshipTypesSyncHandler', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const createHandler = () => {
    const tenantName = tenants.current().name;
    return new PostgresRelationshipTypesSyncHandler({
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
    await testingPG.clear(['relationship_types']);
  });

  it('should save a relationship type', async () => {
    const handler = createHandler();
    const id = new ObjectId().toHexString();

    await handler.save({ _id: id, name: 'Related to', properties: [] });

    const found = await handler.getById(id);
    expect(found).toEqual({ _id: id, name: 'Related to' });
  });

  it('should save multiple relationship types', async () => {
    const handler = createHandler();
    const id1 = new ObjectId().toHexString();
    const id2 = new ObjectId().toHexString();

    await handler.saveMultiple([
      { _id: id1, name: 'Type A' },
      { _id: id2, name: 'Type B' },
    ]);

    const rows = await testingPG.getAllFrom('relationship_types');
    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.name).sort()).toEqual(['Type A', 'Type B']);
  });

  it('should upsert on save', async () => {
    const handler = createHandler();
    const id = new ObjectId().toHexString();

    await handler.save({ _id: id, name: 'Original' });
    await handler.save({ _id: id, name: 'Updated' });

    const found = await handler.getById(id);
    expect(found?.name).toBe('Updated');
  });

  it('should delete a relationship type', async () => {
    const handler = createHandler();
    const id = new ObjectId().toHexString();

    await testingPG.setFixtures({
      relationship_types: [{ _id: id, name: 'To delete' }],
    });

    await handler.delete(id);

    expect(await handler.getById(id)).toBeNull();
  });

  it('should require _id and name on save', async () => {
    const handler = createHandler();

    await expect(handler.save({ name: 'Missing id' })).rejects.toThrow(
      'PostgresRelationshipTypesSyncHandler: document._id is required'
    );
    await expect(handler.save({ _id: new ObjectId().toHexString() })).rejects.toThrow(
      'PostgresRelationshipTypesSyncHandler: document.name is required'
    );
  });

  describe('RelationshipTypesSyncHandlerFactory', () => {
    it('should return mongo handler when postgres flag is off', () => {
      const sut = testingEnvironment.runWithContext(() =>
        RelationshipTypesSyncHandlerFactory.default()
      );

      expect(sut).toBeInstanceOf(MongoRelationshipTypesSyncHandler);
    });

    it('should return postgres handler when postgres flag is on', () => {
      const sut = testingEnvironment.runWithContext(
        () => RelationshipTypesSyncHandlerFactory.default(),
        {
          tenant: {
            ...testingTenants.current(),
            featureFlags: { postgresRelationshipTypes: true },
          },
        }
      );

      expect(sut).toBeInstanceOf(PostgresRelationshipTypesSyncHandler);
    });
  });
});
