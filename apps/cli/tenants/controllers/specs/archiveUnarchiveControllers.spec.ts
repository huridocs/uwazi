import { Db, ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { TenantConflict } from '#api/tenants/application/TenantConflict.js';
import { TenantNotFound } from '#api/tenants/application/errors.js';
import { TenantStorageTaken } from '#api/tenants/application/TenantStorageTaken.js';
import { testingDB } from '#api/utils/testing_db.js';
import { ArchiveTenantController } from '../ArchiveTenantController.js';
import { UnarchiveTenantController } from '../UnarchiveTenantController.js';

const names = [
  'cli-prc-active',
  'cli-prc-mongo',
  'cli-prc-roundtrip',
  'cli-prc-archived',
  'cli-prc-both',
  'cli-prc-missing',
  'cli-prc-storage-archived',
  'cli-prc-storage-holder',
];

const dumpLocation = { db: 'https://s3/db.zip', files: 'https://store/files' };

const fullFlags = {
  postgresCore: true,
  s3Storage: true,
  telemetry: { enabled: true, sampleRate: 0.5 },
  prometheus: { enabled: false, sampleRate: 0.1 },
};

const activeTenant = (
  name: string,
  featureFlags: Record<string, unknown> = { postgresCore: true }
) => ({
  name,
  dbName: name,
  indexName: name,
  uploadedDocuments: `${name}/documents`,
  attachments: `${name}/documents`,
  customUploads: `${name}/custom_uploads`,
  activityLogs: `${name}/log`,
  domain: `${name}.uwazi.io`,
  featureFlags,
  globalMatomo: { id: '1', url: 'https://matomo.example.org' },
  ciMatomoActive: true,
  maintenance: false,
  stats: { entitiesCount: 3 },
  healthChecks: [{ name: 'disk' }],
  metadata: { orgName: 'Acme' },
});

const archivedRow = (name: string) => ({
  _id: new ObjectId(),
  name,
  dbName: name,
  indexName: name,
  uploadedDocuments: `${name}/documents`,
  attachments: `${name}/documents`,
  customUploads: `${name}/custom_uploads`,
  activityLogs: `${name}/log`,
  featureFlags: { postgresCore: true },
  status: 'archived',
  dumpLocation: { db: `https://s3/${name}.zip`, files: `https://store/${name}` },
  archivedAt: 1700000000,
});

describe('archive and unarchive controllers', () => {
  let db: Db;

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await db.collection('archives').deleteMany({ name: { $in: names } });
    await testingDB.tearDown();
  });

  beforeEach(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await db.collection('archives').deleteMany({ name: { $in: names } });
    await db
      .collection('tenants')
      .insertMany([
        activeTenant('cli-prc-active'),
        activeTenant('cli-prc-mongo', { postgresCore: false }),
        activeTenant('cli-prc-roundtrip', fullFlags),
        activeTenant('cli-prc-both'),
      ]);
    await db
      .collection('archives')
      .insertMany([
        archivedRow('cli-prc-archived'),
        archivedRow('cli-prc-both'),
        archivedRow('cli-prc-storage-archived'),
      ]);
    // A second active tenant that took the archived row's database since it was archived.
    await db.collection('tenants').insertOne({
      ...activeTenant('cli-prc-storage-holder'),
      dbName: 'cli-prc-storage-archived',
    });
  });

  describe('archive', () => {
    it('should move the tenant to archives and return the stored archived row', async () => {
      const output = await ArchiveTenantController.handle({
        name: 'cli-prc-active',
        dumpLocation,
      });

      expect(output).toHaveProperty('_id');
      expect(output).toMatchObject({
        name: 'cli-prc-active',
        dbName: 'cli-prc-active',
        indexName: 'cli-prc-active',
        uploadedDocuments: 'cli-prc-active/documents',
        attachments: 'cli-prc-active/documents',
        customUploads: 'cli-prc-active/custom_uploads',
        activityLogs: 'cli-prc-active/log',
        featureFlags: { postgresCore: true },
        status: 'archived',
        dumpLocation,
        archivedAt: expect.any(Number),
      });
      [
        'domain',
        'globalMatomo',
        'ciMatomoActive',
        'maintenance',
        'stats',
        'healthChecks',
        'metadata',
      ].forEach(field => expect(output).not.toHaveProperty(field));

      expect(await db.collection('tenants').findOne({ name: 'cli-prc-active' })).toBeNull();
      expect(await db.collection('archives').findOne({ name: 'cli-prc-active' })).toMatchObject({
        name: 'cli-prc-active',
        status: 'archived',
      });
    });

    it('should archive a tenant whatever its backend flag says', async () => {
      await expect(
        ArchiveTenantController.handle({ name: 'cli-prc-mongo', dumpLocation })
      ).resolves.toMatchObject({ name: 'cli-prc-mongo', status: 'archived' });

      expect(await db.collection('tenants').findOne({ name: 'cli-prc-mongo' })).toBeNull();
      expect(
        (await db.collection('archives').findOne({ name: 'cli-prc-mongo' }))?.featureFlags
      ).toEqual({ postgresCore: false });
    });

    it('should fail with tenant.not_found when the active tenant is missing', async () => {
      await expect(
        ArchiveTenantController.handle({ name: 'cli-prc-missing', dumpLocation })
      ).rejects.toThrow(TenantNotFound);

      expect(await db.collection('archives').findOne({ name: 'cli-prc-missing' })).toBeNull();
    });
  });

  describe('unarchive', () => {
    it('should rebuild the active row and remove the archived row', async () => {
      const output = await UnarchiveTenantController.handle({ name: 'cli-prc-archived' });

      expect(output).not.toHaveProperty('_id');
      expect(output).toMatchObject({
        name: 'cli-prc-archived',
        dbName: 'cli-prc-archived',
        indexName: 'cli-prc-archived',
        uploadedDocuments: 'cli-prc-archived/documents',
        attachments: 'cli-prc-archived/documents',
        customUploads: 'cli-prc-archived/custom_uploads',
        activityLogs: 'cli-prc-archived/log',
        featureFlags: { postgresCore: true },
      });
      expect(output).not.toHaveProperty('status');
      expect(output).not.toHaveProperty('dumpLocation');
      expect(output).not.toHaveProperty('archivedAt');

      expect(await db.collection('tenants').findOne({ name: 'cli-prc-archived' })).toMatchObject({
        name: 'cli-prc-archived',
        featureFlags: { postgresCore: true },
      });
      expect(await db.collection('archives').findOne({ name: 'cli-prc-archived' })).toBeNull();
    });

    it('should fail with tenant.storage_taken when another tenant took the archived storage', async () => {
      await expect(
        UnarchiveTenantController.handle({ name: 'cli-prc-storage-archived' })
      ).rejects.toThrow(TenantStorageTaken);

      expect(
        await db.collection('tenants').findOne({ name: 'cli-prc-storage-archived' })
      ).toBeNull();
      expect(
        await db.collection('archives').findOne({ name: 'cli-prc-storage-archived' })
      ).toMatchObject({
        name: 'cli-prc-storage-archived',
        status: 'archived',
      });
    });

    it('should fail with tenant.not_found when the archived row is missing', async () => {
      await expect(UnarchiveTenantController.handle({ name: 'cli-prc-missing' })).rejects.toThrow(
        TenantNotFound
      );
    });

    it('should fail with tenant.conflict when the name is already active, writing nothing', async () => {
      await expect(UnarchiveTenantController.handle({ name: 'cli-prc-both' })).rejects.toThrow(
        TenantConflict
      );

      expect(await db.collection('tenants').findOne({ name: 'cli-prc-both' })).toMatchObject({
        name: 'cli-prc-both',
        domain: 'cli-prc-both.uwazi.io',
      });
      expect(await db.collection('archives').findOne({ name: 'cli-prc-both' })).toMatchObject({
        name: 'cli-prc-both',
        status: 'archived',
      });
    });
  });

  it('should preserve the full feature flags through archive and unarchive', async () => {
    await ArchiveTenantController.handle({ name: 'cli-prc-roundtrip', dumpLocation });
    await UnarchiveTenantController.handle({ name: 'cli-prc-roundtrip' });

    const restored = await db.collection('tenants').findOne({ name: 'cli-prc-roundtrip' });
    expect(restored?.featureFlags).toEqual(fullFlags);
  });
});
