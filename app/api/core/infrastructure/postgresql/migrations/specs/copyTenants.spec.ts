// oxlint-disable max-statements
import { Db, Long, ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { copyTenants } from '../copyTenants.js';

const paths = (name: string) => ({
  uploadedDocuments: `${name}/documents`,
  attachments: `${name}/documents`,
  customUploads: `${name}/custom_uploads`,
  activityLogs: `${name}/log`,
});

const stats = {
  lastUpdated: 1700000000,
  dbStorage: 1,
  elasticStorage: 2,
  filesStorage: 3,
  entitiesCount: 4,
  filesCount: 5,
  totalStorage: 6,
  filesByBucket: { pdf: { count: 3, size: 1200 }, image: { count: 2, size: 800 } },
  userCount: { admin: 1, editor: 2, collaborator: 3, total: 6 },
  lastSession: 1700000000,
};

const tenantDocument = (name: string) => ({
  _id: new ObjectId(),
  __v: 0,
  name,
  dbName: `${name}_db`,
  indexName: `${name}_index`,
  ...paths(name),
  domain: `${name}.uwazi.io`,
  featureFlags: {
    postgresCore: true,
    esReplicas: 2,
    telemetry: { enabled: true, sampleRate: 0.5, routes: ['/api'], thresholdMs: 200 },
  },
  globalMatomo: { id: '1', url: 'https://matomo.example.org' },
  maintenance: false,
  stats,
  metadata: { orgName: 'Acme', status: 'active', createdAt: Long.fromNumber(1700000000000) },
  temporalFiles: '/tmp/files',
  status: 'ready',
  telemetry: { enabled: true },
});

describe('copyTenants', () => {
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
    await mongo.collection('tenants').deleteMany({});
    await testingEnvironment.pg.pool?.query('DELETE FROM tenants');
  });

  const rows = async () => {
    const result = await testingEnvironment.pg.pool?.query('SELECT * FROM tenants ORDER BY name');
    return result?.rows ?? [];
  };

  it('should copy the known fields to their columns and drop the internal ones', async () => {
    await mongo.collection('tenants').insertMany([tenantDocument('one'), tenantDocument('two')]);

    const result = await copyTenants(mongo);

    expect(result).toEqual({ copied: 2, alreadyPresent: 0 });
    const [one] = await rows();
    expect(one).toMatchObject({
      name: 'one',
      dbName: 'one_db',
      indexName: 'one_index',
      ...paths('one'),
      domain: 'one.uwazi.io',
      maintenance: false,
      globalMatomo: { id: '1', url: 'https://matomo.example.org' },
    });
    expect(one).not.toHaveProperty('_id');
    expect(one).not.toHaveProperty('__v');
    expect(one.ciMatomoActive).toBeNull();
  });

  it('should keep the keys uwazi does not declare in extras', async () => {
    await mongo.collection('tenants').insertOne(tenantDocument('one'));

    await copyTenants(mongo);

    const [one] = await rows();
    expect(one.extras).toEqual({
      temporalFiles: '/tmp/files',
      status: 'ready',
      telemetry: { enabled: true },
    });
  });

  it('should keep unknown keys inside a feature flag group as they are', async () => {
    await mongo.collection('tenants').insertOne(tenantDocument('one'));

    await copyTenants(mongo);

    const [one] = await rows();
    expect(one.featureFlags).toEqual({
      postgresCore: true,
      esReplicas: 2,
      telemetry: { enabled: true, sampleRate: 0.5, routes: ['/api'], thresholdMs: 200 },
    });
  });

  it('should store a BSON long as a number', async () => {
    await mongo.collection('tenants').insertOne(tenantDocument('one'));

    await copyTenants(mongo);

    const [one] = await rows();
    expect(one.metadata).toEqual({ orgName: 'Acme', status: 'active', createdAt: 1700000000000 });
  });

  it('should keep the stats, including the files by bucket', async () => {
    await mongo.collection('tenants').insertOne(tenantDocument('one'));

    await copyTenants(mongo);

    const [one] = await rows();
    expect(one.stats).toEqual(stats);
  });

  it('should default the feature flags of a tenant that has none', async () => {
    const { featureFlags, ...withoutFlags } = tenantDocument('one');
    await mongo.collection('tenants').insertOne(withoutFlags);

    await copyTenants(mongo);

    const [one] = await rows();
    expect(one.featureFlags).toEqual({});
  });

  it('should copy in one run tenants that do not store the same fields', async () => {
    const { featureFlags, ...withoutFlags } = tenantDocument('one');
    await mongo.collection('tenants').insertMany([withoutFlags, tenantDocument('two')]);

    const result = await copyTenants(mongo);

    expect(result).toEqual({ copied: 2, alreadyPresent: 0 });
    const [one, two] = await rows();
    expect(one.featureFlags).toEqual({});
    expect(two.featureFlags).toEqual(featureFlags);
  });

  it('should leave a tenant that postgres already has and copy only the missing one', async () => {
    await mongo.collection('tenants').insertOne(tenantDocument('one'));
    await copyTenants(mongo);
    await testingEnvironment.pg.pool?.query(`UPDATE tenants SET "domain" = 'kept.uwazi.io'`);
    await mongo.collection('tenants').insertOne(tenantDocument('two'));

    const result = await copyTenants(mongo);

    expect(result).toEqual({ copied: 1, alreadyPresent: 1 });
    const stored = await rows();
    expect(stored.map(row => row.name)).toEqual(['one', 'two']);
    expect(stored[0].domain).toBe('kept.uwazi.io');
  });

  it('should copy nothing from an empty registry', async () => {
    expect(await copyTenants(mongo)).toEqual({ copied: 0, alreadyPresent: 0 });
  });
});
