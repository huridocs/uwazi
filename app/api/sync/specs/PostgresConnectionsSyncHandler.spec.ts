import { ObjectId } from 'mongodb';
import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { PostgresConnectionsSyncHandler } from '../PostgresConnectionsSyncHandler.js';

describe('PostgresConnectionsSyncHandler', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const createHandler = () => {
    const tenantName = tenants.current().name;
    return new PostgresConnectionsSyncHandler({
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
    await testingPG.clear(['connections']);
  });

  it('should save a connection', async () => {
    const handler = createHandler();
    const id = new ObjectId().toHexString();
    const hub = new ObjectId().toHexString();

    await handler.save({ _id: id, entity: 'entity1', hub, template: null });

    const found = await handler.getById(id);
    expect(found).toMatchObject({ _id: id, entity: 'entity1', hub });
  });

  it('should save multiple connections', async () => {
    const handler = createHandler();
    const id1 = new ObjectId().toHexString();
    const id2 = new ObjectId().toHexString();

    await handler.saveMultiple([
      { _id: id1, entity: 'e1', hub: new ObjectId().toHexString(), template: null },
      { _id: id2, entity: 'e2', hub: new ObjectId().toHexString(), template: null },
    ]);

    const rows = await testingPG.getAllFrom('connections');
    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.entity).sort()).toEqual(['e1', 'e2']);
  });

  it('should upsert on save', async () => {
    const handler = createHandler();
    const id = new ObjectId().toHexString();

    await handler.save({ _id: id, entity: 'original', hub: new ObjectId().toHexString() });
    await handler.save({ _id: id, entity: 'updated', hub: new ObjectId().toHexString() });

    const found = await handler.getById(id);
    expect(found?.entity).toBe('updated');
  });

  it('should return hub connections', async () => {
    const handler = createHandler();
    const hub = new ObjectId().toHexString();

    await handler.saveMultiple([
      { _id: new ObjectId().toHexString(), entity: 'e1', hub, template: null },
      { _id: new ObjectId().toHexString(), entity: 'e2', hub, template: null },
      { _id: new ObjectId().toHexString(), entity: 'e3', hub: new ObjectId().toHexString() },
    ]);

    const result = await handler.getHubConnections(hub);
    expect(result.map(row => row.entity).sort()).toEqual(['e1', 'e2']);
  });

  it('should delete a connection', async () => {
    const handler = createHandler();
    const id = new ObjectId().toHexString();

    await testingPG.setFixtures({
      connections: [{ _id: id, entity: 'to delete', hub: new ObjectId().toHexString() }],
    });

    await handler.delete(id);

    expect(await handler.getById(id)).toBeNull();
  });

  it('should require _id on save', async () => {
    const handler = createHandler();

    await expect(handler.save({ entity: 'missing id' })).rejects.toThrow(
      'PostgresConnectionsSyncHandler: document._id is required'
    );
  });
});
