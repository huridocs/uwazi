import { Db } from 'mongodb';
import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { ListTenantsController } from '../ListTenantsController.js';

const names = ['cli-tenant-a', 'cli-tenant-b'];

describe('ListTenantsController', () => {
  let db: Db;

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await testingDB.tearDown();
  });

  beforeEach(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await db.collection('tenants').insertMany([
      { name: 'cli-tenant-b', dbName: 'cli-tenant-b', stats: { entitiesCount: 3 } },
      { name: 'cli-tenant-a', dbName: 'cli-tenant-a' },
    ]);
  });

  it('should print every tenant as stored, sorted by name and without the internal id', async () => {
    const output = (await ListTenantsController.handle()).filter(tenant =>
      names.includes(tenant.name as string)
    );

    expect(output).toEqual([
      { name: 'cli-tenant-a', dbName: 'cli-tenant-a' },
      { name: 'cli-tenant-b', dbName: 'cli-tenant-b', stats: { entitiesCount: 3 } },
    ]);
  });
});
