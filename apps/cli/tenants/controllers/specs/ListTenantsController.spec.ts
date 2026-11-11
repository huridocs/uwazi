import { Db, ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { ListTenantsController } from '../ListTenantsController.js';

const names = ['cli-tenant-a', 'cli-tenant-b'];
const archivedNames = ['cli-archived-new', 'cli-archived-old'];

const archived = (name: string, archivedAt: string) => ({
  _id: new ObjectId(),
  name,
  dbName: name,
  status: 'archived',
  dumpLocation: { db: `https://s3/${name}_db.zip`, files: `https://store/${name}` },
  featureFlags: { s3Storage: true },
  archivedAt,
});

const archivedFixtures = [
  archived('cli-archived-old', '1700000100'),
  archived('cli-archived-new', '1700000200'),
];

describe('ListTenantsController', () => {
  let db: Db;

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await db.collection('archives').deleteMany({ name: { $in: archivedNames } });
    await testingDB.tearDown();
  });

  beforeEach(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await db.collection('archives').deleteMany({ name: { $in: archivedNames } });
    await db.collection('tenants').insertMany([
      { name: 'cli-tenant-b', dbName: 'cli-tenant-b', stats: { entitiesCount: 3 } },
      { name: 'cli-tenant-a', dbName: 'cli-tenant-a' },
    ]);
    await db.collection('archives').insertMany(archivedFixtures);
  });

  it('should list active tenants as stored, sorted by name and without the internal id', async () => {
    const output = (await ListTenantsController.handle({ archived: false })).filter(tenant =>
      names.includes(tenant.name as string)
    );

    expect(output).toEqual([
      { name: 'cli-tenant-a', dbName: 'cli-tenant-a' },
      { name: 'cli-tenant-b', dbName: 'cli-tenant-b', stats: { entitiesCount: 3 } },
    ]);
  });

  it('should list archived tenants as stored, newest first', async () => {
    const output = (await ListTenantsController.handle({ archived: true })).filter(tenant =>
      archivedNames.includes(tenant.name as string)
    );

    expect(output).toEqual([archivedFixtures[1], archivedFixtures[0]]);
  });
});
