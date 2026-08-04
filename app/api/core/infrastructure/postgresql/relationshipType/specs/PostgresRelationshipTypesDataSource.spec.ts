import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';
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

const createType = (name: string, id = new ObjectId().toHexString()) =>
  new RelationshipType(id, name);

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
    const relationshipType = createType('Related to');

    await ds.create(relationshipType);

    const loaded = await ds.getById(relationshipType.id);

    expect(loaded).toEqual(relationshipType);
  });

  it('should get all relationship types', async () => {
    const ds = makeDS();
    await ds.create(createType('A'));
    await ds.create(createType('B'));

    const all = await ds.getAll();

    expect(all.map(r => r.name).sort()).toEqual(['A', 'B']);
  });

  it('should update a relationship type name', async () => {
    const ds = makeDS();
    const relationshipType = createType('Old');
    await ds.create(relationshipType);

    const updated = createType('New', relationshipType.id);
    await ds.update(updated);

    expect(await ds.getById(relationshipType.id)).toEqual(updated);
  });

  it('should delete a relationship type', async () => {
    const ds = makeDS();
    const relationshipType = createType('Temp');
    await ds.create(relationshipType);

    await ds.delete(relationshipType.id);

    expect(await ds.getById(relationshipType.id)).toBeNull();
  });

  it('should detect case-insensitive trimmed name collisions', async () => {
    const ds = makeDS();
    const relationshipType = createType('Rel 1');
    await ds.create(relationshipType);

    expect(await ds.existsByName('rel 1')).toBe(true);
    expect(await ds.existsByName('  REL 1  ')).toBe(true);
    expect(await ds.existsByName('REL 1', relationshipType.id)).toBe(false);
    expect(await ds.existsByName('unknown')).toBe(false);
  });

  it('should validate typesExist', async () => {
    const ds = makeDS();
    const a = createType('A');
    const b = createType('B');
    await ds.create(a);
    await ds.create(b);

    expect(await ds.typesExist([a.id, b.id])).toBe(true);
    expect(await ds.typesExist([a.id, new ObjectId().toHexString()])).toBe(false);
  });

  it('should return relationship type ids and getByIds', async () => {
    const ds = makeDS();
    const a = createType('A');
    const b = createType('B');
    await ds.create(a);
    await ds.create(b);

    expect(await ds.getRelationshipTypeIds()).toEqual(expect.arrayContaining([a.id, b.id]));

    const items = await ds.getByIds([a.id, b.id]);
    expect(items.map(i => i.name).sort()).toEqual(['A', 'B']);
  });

  it('should isolate tenants via RLS', async () => {
    const tenantA = makeDS('tenant-a');
    const tenantB = makeDS('tenant-b');

    const created = createType('Only A');
    await tenantA.create(created);

    expect(await tenantA.getById(created.id)).not.toBeNull();
    expect(await tenantB.getById(created.id)).toBeNull();
    expect(await tenantB.getAll()).toEqual([]);
  });
});
