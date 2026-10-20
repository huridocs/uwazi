// eslint-disable-next-line no-restricted-imports
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import knex, { Knex } from 'knex';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '../PgMigrator.js';
import { PgDataMigrationRunner } from '../PgDataMigrationRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PgMigrator data migrations', () => {
  let migrationsDir: string;
  let adminKnex: Knex;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
    adminKnex = knex({ client: 'pg', connection: testingEnvironment.pg.config });
  });

  afterAll(async () => {
    await adminKnex.destroy();
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    migrationsDir = path.join(__dirname, `test-data-migrations-${Date.now()}`);
    mkdirSync(migrationsDir, { recursive: true });
    await adminKnex.raw('DROP TABLE IF EXISTS pg_migrations');
  });

  afterEach(async () => {
    rmSync(migrationsDir, { recursive: true, force: true });
    await adminKnex.raw('DROP TABLE IF EXISTS test_migrations_table');
    await adminKnex.raw('DROP TABLE IF EXISTS test_tenant_rows');
    await adminKnex.raw('DROP TABLE IF EXISTS pg_migrations');
  });

  const createMigration = (fileName: string, contents: string) => {
    writeFileSync(path.join(migrationsDir, fileName), contents);
  };

  const dataMigration = (fields: { reindex: boolean; up: string; scope?: 'global' | 'tenant' }) => `
export const migration = {
  scope: '${fields.scope ?? 'global'}',
  description: 'test data migration',
  reindex: ${fields.reindex},
  async up(ctx) {
    ${fields.up}
  },
};
`;

  const createMigrator = (logger = createMockLogger(), tenants: string[] = []) =>
    new PgMigrator(migrationsDir, testingEnvironment.pg.pool!, {
      logger,
      dataRunner: new PgDataMigrationRunner({
        adminKnex,
        appKnex: PostgresDB.appMigrationKnex(),
        listTenants: () => tenants,
        logger,
      }),
    });

  const createTenantTable = () =>
    createMigration(
      '001-create_tenant_rows.sql',
      `CREATE TABLE test_tenant_rows (id INT, tenant_id TEXT NOT NULL, name TEXT);
       ALTER TABLE test_tenant_rows ENABLE ROW LEVEL SECURITY;
       CREATE POLICY tenant_isolation ON test_tenant_rows
         USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());`
    );

  const tenantRows = async () =>
    adminKnex('test_tenant_rows').select('tenant_id', 'name').orderBy('tenant_id');

  const appliedDeltas = async () =>
    (await adminKnex('pg_migrations').select('delta', 'name').orderBy('delta')).map(row => ({
      delta: row.delta,
      name: row.name,
    }));

  it('should run a .ts migration in sequence order between SQL migrations', async () => {
    createMigration(
      '001-create_table.sql',
      'CREATE TABLE test_migrations_table (id INT PRIMARY KEY)'
    );
    createMigration(
      '002-insert_row.ts',
      dataMigration({
        reindex: false,
        up: "await ctx.knex('test_migrations_table').insert({ id: 1 });",
      })
    );
    createMigration('003-add_column.sql', 'ALTER TABLE test_migrations_table ADD COLUMN name TEXT');

    const { applied } = await createMigrator().migrate();

    expect(applied).toEqual([1, 2, 3]);
    expect(await adminKnex('test_migrations_table').select('id', 'name')).toEqual([
      { id: 1, name: null },
    ]);
    expect(await appliedDeltas()).toEqual([
      { delta: 1, name: 'create_table' },
      { delta: 2, name: 'insert_row' },
      { delta: 3, name: 'add_column' },
    ]);
  });

  it('should keep what a failing .ts migration committed and not record it', async () => {
    createMigration(
      '001-create_table.sql',
      'CREATE TABLE test_migrations_table (id INT PRIMARY KEY)'
    );
    createMigration(
      '002-fails_halfway.ts',
      dataMigration({
        reindex: false,
        up: "await ctx.knex('test_migrations_table').insert({ id: 1 }); throw new Error('batch 2 failed');",
      })
    );
    createMigration('003-not_reached.sql', 'SELECT 3');

    await expect(createMigrator().migrate()).rejects.toThrow('batch 2 failed');

    expect(await adminKnex('test_migrations_table').select('id')).toEqual([{ id: 1 }]);
    expect(await appliedDeltas()).toEqual([{ delta: 1, name: 'create_table' }]);
  });

  it('should return the tenants every migration reported for reindexing', async () => {
    createMigration(
      '001-first.ts',
      dataMigration({ reindex: true, up: "ctx.reindex(['tenant-a', 'tenant-b']);" })
    );
    createMigration(
      '002-second.ts',
      dataMigration({ reindex: true, up: "ctx.reindex(['tenant-b', 'tenant-c']);" })
    );

    const { reindexTenants } = await createMigrator().migrate();

    expect(reindexTenants.sort()).toEqual(['tenant-a', 'tenant-b', 'tenant-c']);
  });

  it('should fail a migration that reports tenants to reindex but declares reindex: false', async () => {
    createMigration(
      '001-undeclared.ts',
      dataMigration({ reindex: false, up: "ctx.reindex(['tenant-a']);" })
    );

    await expect(createMigrator().migrate()).rejects.toThrow(
      'Migration 1 (undeclared) reported tenants to reindex but declares reindex: false'
    );
    expect(await appliedDeltas()).toEqual([]);
  });

  it('should hand the migration the heartbeat and the logger', async () => {
    createMigration(
      '001-reports_progress.ts',
      dataMigration({
        reindex: false,
        up: "await ctx.heartbeat(); ctx.logger.info('batch done');",
      })
    );
    const heartbeat = jest.fn(async () => {});
    const logger = createMockLogger();

    await createMigrator(logger).migrate({ heartbeat });

    expect(heartbeat).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('batch done');
  });

  it('should report the kind of every migration in status', async () => {
    createMigration('001-schema.sql', 'SELECT 1');
    createMigration('002-data.ts', dataMigration({ reindex: false, up: '' }));
    const migrator = createMigrator();
    await migrator.migrate({ until: 1 });

    expect(await migrator.status()).toEqual({
      applied: [{ delta: 1, name: 'schema', kind: 'sql', applied: true, outOfOrder: false }],
      pending: [{ delta: 2, name: 'data', kind: 'data', applied: false, outOfOrder: false }],
    });
  });

  it('should mark pending migrations numbered below the highest applied one', async () => {
    createMigration('002-applied.sql', 'SELECT 2');
    const migrator = createMigrator();
    await migrator.migrate();
    createMigration('001-merged_late.sql', 'SELECT 1');
    createMigration('003-next.ts', dataMigration({ reindex: false, up: '' }));

    const { pending } = await migrator.status();

    expect(pending.map(({ delta, outOfOrder }) => ({ delta, outOfOrder }))).toEqual([
      { delta: 1, outOfOrder: true },
      { delta: 3, outOfOrder: false },
    ]);
  });

  it('should reject a .ts and a .sql migration sharing a delta', async () => {
    createMigration('001-schema.sql', 'SELECT 1');
    createMigration('001-data.ts', dataMigration({ reindex: false, up: '' }));

    await expect(createMigrator().migrate()).rejects.toThrow('Duplicate migration delta(s)');
  });

  describe('tenant scoped', () => {
    it('should run the migration for every tenant and record it once', async () => {
      createTenantTable();
      createMigration(
        '002-name_rows.ts',
        dataMigration({
          scope: 'tenant',
          reindex: false,
          up: "await ctx.transaction(trx => trx('test_tenant_rows').update({ name: ctx.tenantId }));",
        })
      );
      await createMigrator().migrate({ until: 1 });
      await adminKnex('test_tenant_rows').insert([
        { id: 1, tenant_id: 'tenant-a' },
        { id: 2, tenant_id: 'tenant-b' },
      ]);

      const { applied } = await createMigrator(createMockLogger(), [
        'tenant-a',
        'tenant-b',
      ]).migrate();

      expect(applied).toEqual([2]);
      expect(await tenantRows()).toEqual([
        { tenant_id: 'tenant-a', name: 'tenant-a' },
        { tenant_id: 'tenant-b', name: 'tenant-b' },
      ]);
      expect(await appliedDeltas()).toEqual([
        { delta: 1, name: 'create_tenant_rows' },
        { delta: 2, name: 'name_rows' },
      ]);
    });

    it('should not record a migration that failed for one tenant, nor run the next', async () => {
      createTenantTable();
      createMigration(
        '002-name_rows.ts',
        dataMigration({
          scope: 'tenant',
          reindex: false,
          up: `await ctx.transaction(async trx => {
            const broken = await trx('test_tenant_rows').where({ name: 'broken' }).first();
            if (broken) throw new Error('broken row');
            await trx('test_tenant_rows').update({ name: ctx.tenantId });
          });`,
        })
      );
      createMigration('003-not_reached.sql', 'SELECT 3');
      await createMigrator().migrate({ until: 1 });
      await adminKnex('test_tenant_rows').insert([
        { id: 1, tenant_id: 'tenant-a' },
        { id: 2, tenant_id: 'tenant-b', name: 'broken' },
      ]);
      const migrator = createMigrator(createMockLogger(), ['tenant-a', 'tenant-b']);

      await expect(migrator.migrate()).rejects.toThrow(/tenant-b: broken row/);
      expect(await appliedDeltas()).toEqual([{ delta: 1, name: 'create_tenant_rows' }]);
      expect(await tenantRows()).toEqual([
        { tenant_id: 'tenant-a', name: 'tenant-a' },
        { tenant_id: 'tenant-b', name: 'broken' },
      ]);

      await adminKnex('test_tenant_rows').where({ tenant_id: 'tenant-b' }).update({ name: null });
      expect((await migrator.migrate()).applied).toEqual([2, 3]);
      expect(await tenantRows()).toEqual([
        { tenant_id: 'tenant-a', name: 'tenant-a' },
        { tenant_id: 'tenant-b', name: 'tenant-b' },
      ]);
    });
  });
});
