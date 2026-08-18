import { ObjectId } from 'mongodb';
import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { User } from '#api/users.v2/model/User.js';
import { PostgresEntitiesSyncHandler } from '../PostgresEntitiesSyncHandler.js';

const factory = getFixturesFactory();

describe('PostgresEntitiesSyncHandler', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  // Sync receive is admin-gated in production (needsAuthorization(['admin'])),
  // and DependenciesMiddleware puts that admin user in ExecutionContext.actor.
  // The handler enforces entity-level RLS through the actor's AccessContext, so
  // tests must run with a privileged (admin) user — same as the real request.
  const adminUser = new User(new ObjectId().toString(), 'admin', []);

  const createHandler = () => {
    const tenantName = tenants.current().name;
    return new PostgresEntitiesSyncHandler({
      tenantId: tenantName,
      mongoDb: getConnection(),
      pgTransactionManager: new PostgresTransactionManager(
        PostgresDB.knex,
        tenantName,
        LoggerFactory.forTests()
      ),
      accessContext: AccessContext.forActor(adminUser),
    });
  };

  beforeEach(async () => {
    await testingPG.clear(['entities']);
  });

  const syncEntity = (id: string, overrides: Record<string, unknown> = {}) => ({
    _id: id,
    sharedId: 'sharedId',
    language: 'en',
    template: factory.id('template').toHexString(),
    title: 'Synced entity',
    published: true,
    generatedToc: false,
    icon: { _id: null, type: 'entity' },
    creationDate: 100,
    editDate: 200,
    metadata: {},
    user: null,
    permissions: [],
    preview: null,
    ...overrides,
  });

  it('should save an entity', async () => {
    const handler = createHandler();
    const id = factory.id('entity').toHexString();

    await handler.save(syncEntity(id, { title: 'Synced entity' }));

    const found = await handler.getById(id);
    expect(found?.title).toBe('Synced entity');
    expect(found?.sharedId).toBe('sharedId');
    expect(found?.metadata).toEqual({});
  });

  it('should upsert on conflict by _id', async () => {
    const handler = createHandler();
    const id = factory.id('entity').toHexString();

    await handler.save(syncEntity(id, { title: 'Old title' }));
    await handler.save(syncEntity(id, { title: 'New title' }));

    const rows = await testingPG.getAllFrom('entities');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('New title');
  });

  it('should save multiple entities', async () => {
    const handler = createHandler();
    const id1 = factory.id('e1').toHexString();
    const id2 = factory.id('e2').toHexString();

    await handler.saveMultiple([
      syncEntity(id1, { sharedId: 's1', title: 'E1' }),
      syncEntity(id2, { sharedId: 's2', title: 'E2' }),
    ]);

    const rows = await testingPG.getAllFrom('entities');
    expect(rows).toHaveLength(2);
  });

  it('should serialize jsonb fields (metadata, icon, permissions)', async () => {
    const handler = createHandler();
    const id = factory.id('entity').toHexString();

    await handler.save(
      syncEntity(id, {
        metadata: { field1: [{ value: 'val', label: 'Label' }] },
        icon: { _id: 'iconId', type: 'document', label: 'Icon' },
        permissions: [{ refId: 'user1', type: 'user', level: 'write' }],
      })
    );

    const found = await handler.getById(id);
    expect(found?.metadata).toEqual({ field1: [{ value: 'val', label: 'Label' }] });
    expect(found?.icon).toEqual({ _id: 'iconId', type: 'document', label: 'Icon' });
    expect(found?.permissions).toEqual([{ refId: 'user1', type: 'user', level: 'write' }]);
  });

  it('should delete an entity', async () => {
    const handler = createHandler();
    const id = factory.id('entity').toHexString();

    await testingPG.setFixtures({
      entities: [syncEntity(id)],
    });

    await handler.delete(id);

    const found = await handler.getById(id);
    expect(found).toBeNull();
  });
});
