import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { TenantsBackend } from '#api/config.js';
import type {
  ArchivedTenantRecord,
  ArchivedTenantsDataSource,
} from '../contracts/ArchivedTenantsDataSource.js';
import { ArchivedTenantsDataSourceFactory } from '../../infrastructure/ArchivedTenantsDataSourceFactory.js';

const archived = (name: string, archivedAt?: unknown) => ({
  name,
  dbName: name,
  status: 'archived',
  dumpLocation: { db: `https://s3/${name}_db.zip`, files: `https://store/${name}` },
  featureFlags: { s3Storage: true },
  ...(archivedAt === undefined ? {} : { archivedAt }),
});

// `archivedAt` reaches Mongo as a number or a numeric string (or is missing/unreadable); the
// Postgres store normalises it the way the copy migration does, so both backends sort identically.
const sortFixtures = [
  archived('cli-archive-middle', 1700000200),
  archived('cli-archive-unreadable', 'not-a-date'),
  archived('cli-archive-oldest', '1700000100'),
  archived('cli-archive-missing'),
  archived('cli-archive-newest', '1700000300'),
  archived('cli-archive-tie-b', 1700000150),
  archived('cli-archive-tie-a', '1700000150'),
];

const sortNames = sortFixtures.map(row => row.name);
const upsertNames = [
  'cli-archive-upsert-new',
  'cli-archive-upsert-replace',
  'cli-archive-upsert-nameless',
];
const names = [...sortNames, ...upsertNames];

const JSON_COLUMNS = ['featureFlags', 'dumpLocation'];

const toSqlArchivedAt = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
};

type Store = {
  clear(): Promise<void>;
  write(rows: ArchivedTenantRecord[]): Promise<void>;
  read(name: string): Promise<Record<string, unknown> | undefined>;
  count(name: string): Promise<number>;
};

const backends: { name: string; backend: TenantsBackend; store: () => Store }[] = [
  {
    name: 'Mongo',
    backend: 'mongo',
    store: () => {
      const collection = testingDB.db(config.SHARED_DB).collection('archives');
      return {
        clear: async () => {
          await collection.deleteMany({ name: { $in: names } });
        },
        write: async rows => {
          await collection.insertMany(structuredClone(rows));
        },
        read: async name => (await collection.findOne({ name })) ?? undefined,
        count: async name => collection.countDocuments({ name }),
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
          await pool().query('DELETE FROM archived_tenants WHERE name = ANY($1)', [names]);
        },
        write: async rows => {
          await Promise.all(
            rows.map(async row => {
              const { archivedAt, ...rest } = row;
              const normalized = {
                ...rest,
                ...(archivedAt === undefined ? {} : { archivedAt: toSqlArchivedAt(archivedAt) }),
              };
              const columns = Object.keys(normalized);
              await pool().query(
                `INSERT INTO archived_tenants (${columns.map(c => `"${c}"`).join(', ')})
                 VALUES (${columns.map((_c, i) => `$${i + 1}`).join(', ')})`,
                Object.entries(normalized).map(([column, value]) =>
                  JSON_COLUMNS.includes(column) ? JSON.stringify(value) : value
                )
              );
            })
          );
        },
        read: async name => {
          const { rows } = await pool().query('SELECT * FROM archived_tenants WHERE name = $1', [
            name,
          ]);
          return rows[0];
        },
        count: async name => {
          const { rows } = await pool().query(
            'SELECT count(*)::int AS n FROM archived_tenants WHERE name = $1',
            [name]
          );
          return rows[0].n;
        },
      };
    },
  },
];

describe('ArchivedTenantsDataSource', () => {
  let sut: ArchivedTenantsDataSource;

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
      sut = ArchivedTenantsDataSourceFactory.default(backend);
    });

    afterAll(async () => {
      await store.clear();
    });

    describe('newestFirst()', () => {
      beforeEach(async () => {
        await store.write(sortFixtures);
      });

      it('should order by archivedAt, newest first, ties by name, missing and unreadable last', async () => {
        const rows = (await sut.newestFirst()).filter(row =>
          sortNames.includes(row.name as string)
        );

        expect(rows.map(row => row.name)).toEqual([
          'cli-archive-newest',
          'cli-archive-middle',
          'cli-archive-tie-a',
          'cli-archive-tie-b',
          'cli-archive-oldest',
          'cli-archive-missing',
          'cli-archive-unreadable',
        ]);
      });
    });

    describe('getByName()', () => {
      beforeEach(async () => {
        await store.write([archived('cli-archive-middle', 1700000200)]);
      });

      it('should return the row as stored', async () => {
        await expect(sut.getByName('cli-archive-middle')).resolves.toMatchObject(
          archived('cli-archive-middle', 1700000200)
        );
      });

      it('should return undefined when there is no such name', async () => {
        await expect(sut.getByName('cli-archive-absent')).resolves.toBeUndefined();
      });
    });

    describe('upsert()', () => {
      it('should insert a row that does not exist and return it as stored', async () => {
        const row = archived('cli-archive-upsert-new', 1700000400);

        const stored = await sut.upsert('cli-archive-upsert-new', row);

        expect(stored).toMatchObject(row);
        expect(await store.count('cli-archive-upsert-new')).toBe(1);
      });

      it('should replace the stored row, dropping fields the new row lacks', async () => {
        await store.write([archived('cli-archive-upsert-replace', 1700000500)]);
        const replacement = {
          name: 'cli-archive-upsert-replace',
          dbName: 'cli-archive-upsert-replace',
          status: 'archived',
          dumpLocation: { db: 'https://s3/replacement.zip', files: 'https://store/replacement' },
          archivedAt: 1700000999,
        };

        const stored = await sut.upsert('cli-archive-upsert-replace', replacement);

        expect(stored).toMatchObject(replacement);
        expect(stored).not.toHaveProperty('featureFlags');
        expect(await store.count('cli-archive-upsert-replace')).toBe(1);
      });

      it('should store the row under the name given even when the row does not carry name', async () => {
        const row = {
          dbName: 'cli-archive-upsert-nameless',
          status: 'archived',
          archivedAt: 1700000600,
        };

        const stored = await sut.upsert('cli-archive-upsert-nameless', row);

        expect(stored).toMatchObject({ name: 'cli-archive-upsert-nameless', ...row });
        expect(await store.read('cli-archive-upsert-nameless')).toMatchObject({
          name: 'cli-archive-upsert-nameless',
          dbName: 'cli-archive-upsert-nameless',
        });
      });
    });

    describe('delete()', () => {
      it('should delete the row and report it', async () => {
        await store.write([archived('cli-archive-middle', 1700000200)]);

        await expect(sut.delete('cli-archive-middle')).resolves.toBe(true);
        expect(await store.count('cli-archive-middle')).toBe(0);
      });

      it('should report false when there is nothing to delete', async () => {
        await expect(sut.delete('cli-archive-absent')).resolves.toBe(false);
      });
    });
  });
});
