import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresRelationshipTypesDataSource } from '../PostgresRelationshipTypesDataSource.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';

const TENANT_ID = 'test-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId = TENANT_ID) =>
  new PostgresRelationshipTypesDataSource({
    tenantId,
    mongoDb: getConnection(),
    pgTransactionManager: managerFor(tenantId),
  });

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingEnvironment.setUp({});
  await testingPG.clear(['relationship_types']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresRelationshipTypesDataSource', () => {
  it('should create and get by id', async () => {
    const ds = makeDS();
    const created = await ds.create({ name: 'Related to' });

    const loaded = await ds.getById(created.id);

    expect(loaded).toEqual(created);
    expect(created.name).toBe('Related to');
  });

  it('should get all relationship types', async () => {
    const ds = makeDS();
    await ds.create({ name: 'A' });
    await ds.create({ name: 'B' });

    const all = await ds.getAll();

    expect(all.map(r => r.name).sort()).toEqual(['A', 'B']);
  });

  it('should update a relationship type name', async () => {
    const ds = makeDS();
    const created = await ds.create({ name: 'Old' });

    const updated = await ds.update({ id: created.id, name: 'New' });

    expect(updated.name).toBe('New');
    expect(await ds.getById(created.id)).toEqual(updated);
  });

  it('should delete a relationship type', async () => {
    const ds = makeDS();
    const created = await ds.create({ name: 'Temp' });

    await ds.delete(created.id);

    expect(await ds.getById(created.id)).toBeNull();
  });

  it('should detect case-insensitive trimmed name collisions', async () => {
    const ds = makeDS();
    const created = await ds.create({ name: 'Rel 1' });

    expect(await ds.existsByName('rel 1')).toBe(true);
    expect(await ds.existsByName('  REL 1  ')).toBe(true);
    expect(await ds.existsByName('REL 1', created.id)).toBe(false);
    expect(await ds.existsByName('unknown')).toBe(false);
  });

  it('should validate typesExist', async () => {
    const ds = makeDS();
    const a = await ds.create({ name: 'A' });
    const b = await ds.create({ name: 'B' });

    expect(await ds.typesExist([a.id, b.id])).toBe(true);
    expect(await ds.typesExist([a.id, new ObjectId().toHexString()])).toBe(false);
  });

  it('should return relationship type ids and getByIds', async () => {
    const ds = makeDS();
    const a = await ds.create({ name: 'A' });
    const b = await ds.create({ name: 'B' });

    expect(await ds.getRelationshipTypeIds()).toEqual(expect.arrayContaining([a.id, b.id]));

    const items = await ds.getByIds([a.id, b.id]).all();
    expect(items.map(i => i.name).sort()).toEqual(['A', 'B']);
  });

  it('should isolate tenants via RLS', async () => {
    const tenantA = makeDS('tenant-a');
    const tenantB = makeDS('tenant-b');

    const created = await tenantA.create({ name: 'Only A' });

    expect(await tenantA.getById(created.id)).not.toBeNull();
    expect(await tenantB.getById(created.id)).toBeNull();
    expect(await tenantB.getAll()).toEqual([]);
  });
});
