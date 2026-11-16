import { Db, ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { TenantNotFound } from '#api/tenants/application/errors.js';
import { testingDB } from '#api/utils/testing_db.js';
import { DeleteTenantController } from '../DeleteTenantController.js';

const activeName = 'cli-del-active';
const archivedNames = ['cli-del-archived', 'cli-del-missing'];

const activeTenant = (name: string) => ({
  name,
  dbName: name,
  indexName: name,
});

const archivedRow = (name: string) => ({
  _id: new ObjectId(),
  name,
  dbName: name,
  status: 'archived',
  dumpLocation: { db: `https://s3/${name}.zip`, files: `https://store/${name}` },
  archivedAt: 1700000000,
});

/** The controller is wiring: it routes between the two registries and reports which one it removed. */
describe('DeleteTenantController', () => {
  let db: Db;

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await db.collection('tenants').deleteMany({ name: activeName });
    await db.collection('archives').deleteMany({ name: { $in: archivedNames } });
    await testingDB.tearDown();
  });

  beforeEach(async () => {
    await db.collection('tenants').deleteMany({ name: activeName });
    await db.collection('archives').deleteMany({ name: { $in: archivedNames } });
    await db.collection('tenants').insertOne(activeTenant(activeName));
    await db.collection('archives').insertOne(archivedRow('cli-del-archived'));
  });

  it('should delete an active tenant and report which one', async () => {
    expect(await DeleteTenantController.handle({ name: activeName, archived: false })).toEqual({
      name: activeName,
    });
    expect(await db.collection('tenants').findOne({ name: activeName })).toBeNull();
  });

  it('should delete an archived tenant and report which one, leaving active tenants alone', async () => {
    expect(
      await DeleteTenantController.handle({ name: 'cli-del-archived', archived: true })
    ).toEqual({ name: 'cli-del-archived' });

    expect(await db.collection('archives').findOne({ name: 'cli-del-archived' })).toBeNull();
    expect(await db.collection('tenants').findOne({ name: activeName })).toMatchObject({
      name: activeName,
    });
  });

  it('should fail with tenant.not_found when the archived tenant is missing', async () => {
    await expect(
      DeleteTenantController.handle({ name: 'cli-del-missing', archived: true })
    ).rejects.toThrow(TenantNotFound);
  });

  it('should fail with tenant.not_found when the active tenant is missing', async () => {
    await expect(
      DeleteTenantController.handle({ name: 'cli-del-missing', archived: false })
    ).rejects.toThrow(TenantNotFound);
  });
});
