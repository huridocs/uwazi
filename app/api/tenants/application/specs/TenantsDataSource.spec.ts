import { Db } from 'mongodb';
import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import type { TenantsDataSource } from '../contracts/TenantsDataSource.js';
import { TenantsDataSourceFactory } from '../../infrastructure/TenantsDataSourceFactory.js';

const names = ['ds-tenant-a', 'ds-tenant-b', 'ds-tenant-c'];

const stored = [
  {
    name: 'ds-tenant-b',
    dbName: 'ds-tenant-b',
    indexName: 'ds-tenant-b',
    domain: 'b.uwazi.io',
    featureFlags: { postgresCore: true, fileCacheHeaders: true, telemetry: { enabled: true } },
  },
  { name: 'ds-tenant-a', dbName: 'ds-tenant-a', indexName: 'ds-tenant-a' },
];

/**
 * The TenantsDataSource contract suite. One suite per backend; #9683 adds Postgres to
 * `backends`. Fixtures are written and read back through the driver, never through the
 * data source.
 */
const backends = [{ name: 'Mongo' }];

/**
 * `fileCacheHeaders` rather than a flag other suites count globally: these rows live in the real
 * shared collection while the suite runs, and `tenantsContext` loads whatever is there into the
 * process wide registry.
 */

describe('TenantsDataSource', () => {
  let db: Db;
  let sut: TenantsDataSource;

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  describe.each(backends)('$name', () => {
    beforeEach(async () => {
      await db.collection('tenants').deleteMany({ name: { $in: names } });
      await db.collection('tenants').insertMany(structuredClone(stored));
      sut = TenantsDataSourceFactory.default();
    });

    afterAll(async () => {
      await db.collection('tenants').deleteMany({ name: { $in: names } });
    });

    describe('all()', () => {
      it('should return every tenant sorted by name, without the internal id', async () => {
        const result = (await sut.all()).filter(tenant => names.includes(tenant.name));

        expect(result.map(tenant => tenant.name)).toEqual(['ds-tenant-a', 'ds-tenant-b']);
        expect(result[1]).toEqual(stored[0]);
        expect(result[0]).not.toHaveProperty('_id');
      });
    });

    describe('getByName()', () => {
      it('should return the tenant', async () => {
        expect(await sut.getByName('ds-tenant-b')).toEqual(stored[0]);
      });

      it('should return undefined when there is no such tenant', async () => {
        expect(await sut.getByName('ds-tenant-c')).toBeUndefined();
      });
    });

    describe('upsert()', () => {
      it('should insert a tenant that does not exist', async () => {
        const result = await sut.upsert('ds-tenant-c', { dbName: 'ds-tenant-c' });

        expect(result).toEqual({ name: 'ds-tenant-c', dbName: 'ds-tenant-c' });
        expect(await db.collection('tenants').findOne({ name: 'ds-tenant-c' })).toMatchObject({
          name: 'ds-tenant-c',
          dbName: 'ds-tenant-c',
        });
      });

      it('should change only the fields sent', async () => {
        const result = await sut.upsert('ds-tenant-b', { domain: 'changed.uwazi.io' });

        expect(result).toEqual({ ...stored[0], domain: 'changed.uwazi.io' });
      });

      it('should remove a top level field sent as null', async () => {
        const result = await sut.upsert('ds-tenant-b', { domain: null });

        expect(result).not.toHaveProperty('domain');
      });

      it('should merge feature flags, leaving the ones not sent alone', async () => {
        const result = await sut.upsert('ds-tenant-b', { featureFlags: { postgresPages: true } });

        expect(result.featureFlags).toEqual({
          postgresCore: true,
          fileCacheHeaders: true,
          postgresPages: true,
          telemetry: { enabled: true },
        });
      });

      it('should remove a single feature flag sent as null', async () => {
        const result = await sut.upsert('ds-tenant-b', { featureFlags: { postgresCore: null } });

        expect(result.featureFlags).toEqual({
          fileCacheHeaders: true,
          telemetry: { enabled: true },
        });
      });

      it('should remove a flag inside a group without touching its siblings', async () => {
        await sut.upsert('ds-tenant-b', { featureFlags: { telemetry: { sampleRate: 0.5 } } });
        const result = await sut.upsert('ds-tenant-b', {
          featureFlags: { telemetry: { enabled: null } },
        });

        expect(result.featureFlags?.telemetry).toEqual({ sampleRate: 0.5 });
      });

      it('should ignore fields sent as undefined', async () => {
        const result = await sut.upsert('ds-tenant-b', { domain: undefined });

        expect(result).toEqual(stored[0]);
      });
    });

    describe('delete()', () => {
      it('should delete the tenant and report it', async () => {
        expect(await sut.delete('ds-tenant-b')).toBe(true);
        expect(await db.collection('tenants').findOne({ name: 'ds-tenant-b' })).toBeNull();
      });

      it('should report that there was nothing to delete', async () => {
        expect(await sut.delete('ds-tenant-c')).toBe(false);
      });
    });
  });
});
