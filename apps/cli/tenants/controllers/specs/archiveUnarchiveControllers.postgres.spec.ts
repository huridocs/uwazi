import { config } from '#api/config.js';
import { ArchivedTenantsDataSourceFactory } from '#api/tenants/infrastructure/ArchivedTenantsDataSourceFactory.js';
import { TenantsDataSourceFactory } from '#api/tenants/infrastructure/TenantsDataSourceFactory.js';
import { TenantConflict } from '#api/tenants/application/TenantConflict.js';
import { TenantNotFound } from '#api/tenants/application/errors.js';
import { TenantStorageTaken } from '#api/tenants/application/TenantStorageTaken.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ArchiveTenantController } from '../ArchiveTenantController.js';
import { UnarchiveTenantController } from '../UnarchiveTenantController.js';

const names = [
  'pg-active',
  'pg-archived',
  'pg-both',
  'pg-roundtrip',
  'pg-missing',
  'pg-storage-archived',
  'pg-storage-holder',
];
const dumpLocation = { db: 'https://s3/db.zip', files: 'https://store/files' };

const fullFlags = {
  postgresCore: true,
  telemetry: { enabled: true, sampleRate: 0.5 },
};

const activeTenant = (name: string, featureFlags = { postgresCore: true }) => ({
  dbName: name,
  indexName: name,
  uploadedDocuments: `${name}/documents`,
  attachments: `${name}/documents`,
  customUploads: `${name}/custom_uploads`,
  activityLogs: `${name}/log`,
  domain: `${name}.uwazi.io`,
  featureFlags,
});

const archivedRow = (name: string) => ({
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

/** Same controllers, forced onto the Postgres backend through the process-level switch. */
describe('archive and unarchive controllers on Postgres', () => {
  const originalBackend = config.tenantsBackend;

  beforeAll(async () => {
    await testingDB.connect();
    await testingEnvironment.setUp({}, { postgres: true, postgresMirror: [] });
    // The controllers read the backend from the process-level config; restore it in afterAll.
    config.tenantsBackend = 'postgres';
  });

  afterAll(async () => {
    config.tenantsBackend = originalBackend;
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    const tenants = TenantsDataSourceFactory.default();
    const archived = ArchivedTenantsDataSourceFactory.default();
    await Promise.all(names.flatMap(name => [tenants.delete(name), archived.delete(name)]));

    await tenants.upsert('pg-active', activeTenant('pg-active'));
    await tenants.upsert('pg-roundtrip', activeTenant('pg-roundtrip', fullFlags));
    await tenants.upsert('pg-both', activeTenant('pg-both'));
    await archived.upsert('pg-archived', archivedRow('pg-archived'));
    await archived.upsert('pg-both', archivedRow('pg-both'));
    await archived.upsert('pg-storage-archived', archivedRow('pg-storage-archived'));
    // A second active tenant that took the archived row's database since it was archived.
    await tenants.upsert('pg-storage-holder', {
      ...activeTenant('pg-storage-holder'),
      dbName: 'pg-storage-archived',
    });
  });

  it('should archive and unarchive a tenant, preserving the full feature flags', async () => {
    const stored = await ArchiveTenantController.handle({
      name: 'pg-roundtrip',
      dumpLocation,
    });

    expect(stored).toMatchObject({
      name: 'pg-roundtrip',
      status: 'archived',
      featureFlags: fullFlags,
    });
    expect(await TenantsDataSourceFactory.default().getByName('pg-roundtrip')).toBeUndefined();

    const restored = await UnarchiveTenantController.handle({ name: 'pg-roundtrip' });

    expect(restored).toMatchObject({ name: 'pg-roundtrip', featureFlags: fullFlags });
    expect(restored).not.toHaveProperty('status');
    expect(restored).not.toHaveProperty('dumpLocation');
    expect(restored).not.toHaveProperty('archivedAt');
    expect(
      await ArchivedTenantsDataSourceFactory.default().getByName('pg-roundtrip')
    ).toBeUndefined();
  });

  it('should refuse to unarchive into an already-active tenant', async () => {
    await expect(UnarchiveTenantController.handle({ name: 'pg-both' })).rejects.toThrow(
      TenantConflict
    );
  });

  it('should refuse to unarchive onto storage another tenant took', async () => {
    await expect(UnarchiveTenantController.handle({ name: 'pg-storage-archived' })).rejects.toThrow(
      TenantStorageTaken
    );

    expect(
      await TenantsDataSourceFactory.default().getByName('pg-storage-archived')
    ).toBeUndefined();
    expect(
      await ArchivedTenantsDataSourceFactory.default().getByName('pg-storage-archived')
    ).toMatchObject({ name: 'pg-storage-archived', status: 'archived' });
  });

  it('should fail with tenant.not_found when the archived row is missing', async () => {
    await expect(UnarchiveTenantController.handle({ name: 'pg-missing' })).rejects.toThrow(
      TenantNotFound
    );
  });
});
