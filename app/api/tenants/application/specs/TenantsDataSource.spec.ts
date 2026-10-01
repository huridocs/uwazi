import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { TenantsBackend } from '#api/config.js';
import type { TenantsDataSource } from '../contracts/TenantsDataSource.js';
import { TenantsDataSourceFactory } from '../../infrastructure/TenantsDataSourceFactory.js';

const names = ['ds-tenant-a', 'ds-tenant-b', 'ds-tenant-c'];

const paths = (name: string) => ({
  uploadedDocuments: `${name}/documents`,
  attachments: `${name}/documents`,
  customUploads: `${name}/custom_uploads`,
  activityLogs: `${name}/log`,
});

const stored = [
  {
    name: 'ds-tenant-b',
    dbName: 'ds-tenant-b',
    indexName: 'ds-tenant-b',
    ...paths('ds-tenant-b'),
    domain: 'b.uwazi.io',
    featureFlags: { postgresCore: true, fileCacheHeaders: true, telemetry: { enabled: true } },
    metadata: { orgName: 'Org B', notes: 'first' },
  },
  {
    name: 'ds-tenant-a',
    dbName: 'ds-tenant-a',
    indexName: 'ds-tenant-a',
    ...paths('ds-tenant-a'),
  },
];

const newTenant = {
  dbName: 'ds-tenant-c',
  indexName: 'ds-tenant-c',
  ...paths('ds-tenant-c'),
};

const healthChecks = [
  { name: 'disk', lastUpdated: 1700000000, warnings: ['almost full'], problems: [], summary: {} },
  { name: 'files', lastUpdated: 1700000001, warnings: [], problems: ['missing'], summary: null },
];

type Store = {
  clear(): Promise<void>;
  write(rows: typeof stored): Promise<void>;
  read(name: string): Promise<Record<string, unknown> | undefined>;
};

const JSON_COLUMNS = ['featureFlags', 'globalMatomo', 'stats', 'healthChecks', 'metadata'];

/**
 * The TenantsDataSource contract suite: one suite, every backend. Fixtures are written and read
 * back through the driver, never through the data source.
 */
const backends: { name: string; backend: TenantsBackend; store: () => Store }[] = [
  {
    name: 'Mongo',
    backend: 'mongo',
    store: () => {
      const collection = testingDB.db(config.SHARED_DB).collection('tenants');
      return {
        clear: async () => {
          await collection.deleteMany({ name: { $in: names } });
        },
        write: async rows => {
          await collection.insertMany(structuredClone(rows));
        },
        read: async name => (await collection.findOne({ name })) ?? undefined,
      };
    },
  },
  {
    name: 'Postgres',
    backend: 'postgres',
    store: () => {
      const pool = () => testingEnvironment.pg.pool!;
      return {
        clear: async () => {
          await pool().query('DELETE FROM tenants WHERE name = ANY($1)', [names]);
        },
        write: async rows => {
          await Promise.all(
            rows.map(async row => {
              const columns = Object.keys(row);
              await pool().query(
                `INSERT INTO tenants (${columns.map(c => `"${c}"`).join(', ')})
                 VALUES (${columns.map((_c, i) => `$${i + 1}`).join(', ')})`,
                Object.entries(row).map(([column, value]) =>
                  JSON_COLUMNS.includes(column) ? JSON.stringify(value) : value
                )
              );
            })
          );
        },
        read: async name => {
          const { rows } = await pool().query('SELECT * FROM tenants WHERE name = $1', [name]);
          return rows[0];
        },
      };
    },
  },
];

/**
 * `fileCacheHeaders` rather than a flag other suites count globally: these rows live in the real
 * shared collection while the suite runs, and `tenantsContext` loads whatever is there into the
 * process wide registry.
 */

describe('TenantsDataSource', () => {
  let sut: TenantsDataSource;

  beforeAll(async () => {
    await testingDB.connect();
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name', ({ backend, store: createStore }) => {
    let store: Store;

    beforeEach(async () => {
      store = createStore();
      await store.clear();
      await store.write(stored);
      sut = TenantsDataSourceFactory.default(backend);
    });

    afterAll(async () => {
      await store.clear();
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

      it('should leave out the fields the tenant does not have, never returning null', async () => {
        const result = await sut.getByName('ds-tenant-a');

        expect(Object.keys(result!).sort()).toEqual(Object.keys(stored[1]).sort());
      });
    });

    describe('upsert()', () => {
      it('should insert a tenant that does not exist', async () => {
        const result = await sut.upsert('ds-tenant-c', newTenant);

        expect(result).toEqual({ name: 'ds-tenant-c', ...newTenant });
        expect(await store.read('ds-tenant-c')).toMatchObject({
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

      it('should merge metadata key by key, removing the keys sent as null', async () => {
        const result = await sut.upsert('ds-tenant-b', {
          metadata: { adminEmail: 'admin@b.org', notes: null },
        });

        expect(result.metadata).toEqual({ orgName: 'Org B', adminEmail: 'admin@b.org' });
        expect((await store.read('ds-tenant-b'))?.metadata).toEqual(result.metadata);
      });

      it('should remove the whole metadata sent as null', async () => {
        const result = await sut.upsert('ds-tenant-b', { metadata: null });

        expect(result).not.toHaveProperty('metadata');
      });

      it('should store and return the operational data', async () => {
        const stats = {
          lastUpdated: 1700000000,
          dbStorage: 1,
          elasticStorage: 2,
          filesStorage: 3,
          entitiesCount: 4,
          filesCount: 5,
          totalStorage: 6,
          filesByBucket: { pdf: { count: 3, size: 1200 } },
          userCount: { admin: 1, editor: 2, collaborator: 3, total: 6 },
          lastSession: 1700000000,
        };
        const metadata = { orgName: 'Acme', status: 'active' as const };

        await sut.upsert('ds-tenant-b', { stats, healthChecks, metadata });

        expect(await sut.getByName('ds-tenant-b')).toEqual({
          ...stored[0],
          stats,
          healthChecks,
          metadata: { orgName: 'Acme', notes: 'first', status: 'active' },
        });
      });

      it('should ignore fields sent as undefined', async () => {
        const result = await sut.upsert('ds-tenant-b', { domain: undefined });

        expect(result).toEqual(stored[0]);
      });
    });

    describe('delete()', () => {
      it('should delete the tenant and report it', async () => {
        expect(await sut.delete('ds-tenant-b')).toBe(true);
        expect(await store.read('ds-tenant-b')).toBeUndefined();
      });

      it('should report that there was nothing to delete', async () => {
        expect(await sut.delete('ds-tenant-c')).toBe(false);
      });
    });
  });
});
