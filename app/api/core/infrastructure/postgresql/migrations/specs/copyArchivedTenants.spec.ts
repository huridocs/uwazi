import { Db, Long, ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { copyArchivedTenants } from '../copyArchivedTenants.js';

const archivedDocument = (name: string, archivedAt?: unknown) => ({
  _id: new ObjectId(),
  name,
  dbName: `${name}_db`,
  indexName: `${name}_index`,
  uploadedDocuments: `${name}/documents`,
  attachments: `${name}/documents`,
  customUploads: `${name}/custom_uploads`,
  activityLogs: `${name}/log`,
  featureFlags: { postgresCore: true, esReplicas: Long.fromNumber(2) },
  status: 'archived',
  dumpLocation: { db: `https://s3/${name}.zip`, files: `https://store/${name}` },
  ...(archivedAt === undefined ? {} : { archivedAt }),
  stray: 'drop me',
});

describe('copyArchivedTenants', () => {
  let mongo: Db;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true, postgresMirror: [] });
    if (!testingDB.mongodb) throw new Error('Testing mongodb not connected');
    mongo = testingDB.mongodb;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await mongo.collection('archives').deleteMany({});
    await testingEnvironment.pg.pool?.query('DELETE FROM archived_tenants');
  });

  const rows = async () => {
    const result = await testingEnvironment.pg.pool?.query(
      'SELECT * FROM archived_tenants ORDER BY name'
    );
    return (result?.rows ?? []).map(row => ({
      ...row,
      archivedAt: row.archivedAt === null ? null : Number(row.archivedAt),
    }));
  };

  it('should copy the known fields to their columns and drop the internal and stray keys', async () => {
    await mongo
      .collection('archives')
      .insertMany([archivedDocument('one', 1700000100), archivedDocument('two', 1700000200)]);

    const result = await copyArchivedTenants(mongo);

    expect(result).toEqual({ copied: 2, alreadyPresent: 0 });
    const [one] = await rows();
    expect(one).toMatchObject({
      name: 'one',
      dbName: 'one_db',
      indexName: 'one_index',
      uploadedDocuments: 'one/documents',
      attachments: 'one/documents',
      customUploads: 'one/custom_uploads',
      activityLogs: 'one/log',
      status: 'archived',
      archivedAt: 1700000100,
    });
    expect(one).not.toHaveProperty('_id');
    expect(one).not.toHaveProperty('stray');
  });

  it('should store the JSON columns as objects, with a BSON long as a number', async () => {
    await mongo.collection('archives').insertOne(archivedDocument('one', 1700000100));

    await copyArchivedTenants(mongo);

    const [one] = await rows();
    expect(one.featureFlags).toEqual({ postgresCore: true, esReplicas: 2 });
    expect(one.dumpLocation).toEqual({
      db: 'https://s3/one.zip',
      files: 'https://store/one',
    });
  });

  it('should normalise archivedAt: number stays, numeric string becomes a number, unreadable and missing become null', async () => {
    await mongo
      .collection('archives')
      .insertMany([
        archivedDocument('number', 1700000100),
        archivedDocument('numeric-string', '1700000200'),
        archivedDocument('unreadable', 'not-a-date'),
        archivedDocument('missing'),
      ]);

    await copyArchivedTenants(mongo);

    const byName = Object.fromEntries((await rows()).map(row => [row.name, row]));
    expect(byName.number.archivedAt).toBe(1700000100);
    expect(byName['numeric-string'].archivedAt).toBe(1700000200);
    expect(byName.unreadable.archivedAt).toBeNull();
    expect(byName.missing.archivedAt).toBeNull();
  });

  it('should leave a row Postgres already has and copy only the missing one', async () => {
    await mongo.collection('archives').insertOne(archivedDocument('one', 1700000100));
    await copyArchivedTenants(mongo);
    await testingEnvironment.pg.pool?.query(
      `UPDATE archived_tenants SET "dbName" = 'kept_db' WHERE name = 'one'`
    );
    await mongo.collection('archives').insertOne(archivedDocument('two', 1700000200));

    const result = await copyArchivedTenants(mongo);

    expect(result).toEqual({ copied: 1, alreadyPresent: 1 });
    const byName = Object.fromEntries((await rows()).map(row => [row.name, row]));
    expect(Object.keys(byName).sort()).toEqual(['one', 'two']);
    expect(byName.one.dbName).toBe('kept_db');
  });

  it('should copy nothing from an empty collection', async () => {
    expect(await copyArchivedTenants(mongo)).toEqual({ copied: 0, alreadyPresent: 0 });
  });
});
