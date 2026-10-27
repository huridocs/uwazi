import { Readable } from 'stream';
import type { Pool } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PrematureEndOfStreamError } from '../PrematureEndOfStreamError.js';
import { UnknownTableInManifestError } from '../UnknownTableInManifestError.js';
import { SchemaVersionMismatchError } from '../SchemaVersionMismatchError.js';
import { PgTenantBackup } from '../PgTenantBackup.js';
import type { TenantTableProgress } from '../PgTenantBackup.js';
import { discoverDataTablesWithColumns } from '../tenantTableDiscovery.js';
import {
  CaptureStream,
  clearTables,
  exportTenant,
  expectClonedJobs,
  expectRestoredContent,
  importInto,
  manifestOf,
  seedJobs,
  seedSource,
  SOURCE_TENANT,
  TARGET_TENANT,
  backupAtVersion,
} from './helpers.js';

describe('PgTenantBackup', () => {
  let pool: Pool;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    const testPool = testingEnvironment.pg.pool;
    if (!testPool) throw new Error('PG pool not available');
    pool = testPool;
    await clearTables(pool);
  });

  afterEach(async () => {
    await clearTables(pool);
  });

  describe('clean', () => {
    it('deletes every tenant-scoped row, in-flight tables included, and is idempotent', async () => {
      await seedSource(pool, SOURCE_TENANT);
      await seedJobs(pool, SOURCE_TENANT);

      const backup = new PgTenantBackup(pool);
      const first = await backup.clean(SOURCE_TENANT);

      expect(first.deletedRows).toBe(9);
      expect(first.tables).toEqual(
        expect.arrayContaining(['templates', 'captchas', 'jobs', 'password_recoveries'])
      );

      const leftovers = await pool.query(`SELECT 1 FROM ix_extractors WHERE "tenant_id" = $1`, [
        SOURCE_TENANT,
      ]);
      expect(leftovers.rowCount).toBe(0);

      const second = await backup.clean(SOURCE_TENANT);
      expect(second.deletedRows).toBe(0);
    });

    it('leaves another tenant untouched', async () => {
      await seedSource(pool, SOURCE_TENANT);

      await new PgTenantBackup(pool).clean(TARGET_TENANT);

      const source = await pool.query(`SELECT 1 FROM templates WHERE "tenant_id" = $1`, [
        SOURCE_TENANT,
      ]);
      expect(source.rowCount).toBe(1);
    });
  });

  describe('export', () => {
    it('streams a manifest of data tables, skipping only ephemeral tables', async () => {
      await seedSource(pool, SOURCE_TENANT);
      await seedJobs(pool, SOURCE_TENANT);

      const { text, tables } = await exportTenant(pool, SOURCE_TENANT);
      const manifest = manifestOf(text);

      expect(tables).toEqual(manifest.tables.map(t => t.name));
      expect(tables).toEqual(
        expect.arrayContaining(['templates', 'px_entities_status', 'csv_imports', 'jobs'])
      );
      expect(tables).not.toEqual(expect.arrayContaining(['captchas', 'password_recoveries']));
    });

    it('records the current schema version in the manifest', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const capture = new CaptureStream();

      await new PgTenantBackup(pool, async () => 12).export(SOURCE_TENANT, capture);

      expect(manifestOf(capture.text).schemaVersion).toBe(12);
    });

    it('reports per-table progress with row counts and table total', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const events: TenantTableProgress[] = [];
      const capture = new CaptureStream();

      await new PgTenantBackup(pool).export(SOURCE_TENANT, capture, event => events.push(event));

      const templates = events.filter(e => e.table === 'templates');
      expect(templates).toMatchObject([
        { table: 'templates', rows: 1, done: false },
        { table: 'templates', rows: 1, done: true },
      ]);
      expect(templates[0].total).toBe((await discoverDataTablesWithColumns(pool)).length);
      expect(events[events.length - 1]).toMatchObject({ done: true });
    });

    it('reports running row counts as they stream', async () => {
      await pool.query(
        `INSERT INTO templates ("_id", "name", "tenant_id")
         SELECT 'tpl-' || g, 'Doc ' || g, $1 FROM generate_series(1, 1500) AS g`,
        [SOURCE_TENANT]
      );
      const events: TenantTableProgress[] = [];
      const capture = new CaptureStream();

      await new PgTenantBackup(pool).export(SOURCE_TENANT, capture, event => events.push(event));

      const templates = events.filter(e => e.table === 'templates');
      expect(templates).toMatchObject([
        { table: 'templates', rows: 1, done: false },
        { table: 'templates', rows: 1001, done: false },
        { table: 'templates', rows: 1500, done: true },
      ]);
    });
  });

  describe('import', () => {
    it('rewrites tenant_id to the target and preserves settings.sync', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);
      const result = await importInto(pool, TARGET_TENANT, text);
      expect(result).toMatchObject({ sourceTenant: SOURCE_TENANT, rows: 6 });
      await expectRestoredContent(pool, TARGET_TENANT, { url: 'https://example.com' });
    });

    it('nulls settings.sync when nullSync is set', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);
      await new PgTenantBackup(pool).import(TARGET_TENANT, Readable.from([text]), {
        nullSync: true,
      });
      await expectRestoredContent(pool, TARGET_TENANT, null);
    });

    it('keeps ix foreign keys intact and leaves the source untouched', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);
      await importInto(pool, TARGET_TENANT, text);

      const models = await pool.query(
        `SELECT m."extractorId", e."_id" AS extractor
         FROM ix_models m JOIN ix_extractors e
           ON e."_id" = m."extractorId" AND e."tenant_id" = m."tenant_id"
         WHERE m."tenant_id" = $1`,
        [TARGET_TENANT]
      );
      expect(models.rows).toEqual([{ extractorId: 'ext-1', extractor: 'ext-1' }]);

      const source = await pool.query(`SELECT 1 FROM templates WHERE "tenant_id" = $1`, [
        SOURCE_TENANT,
      ]);
      expect(source.rowCount).toBe(1);
    });

    it('round-trips every discovered data table, even when empty', async () => {
      const { text, tables } = await exportTenant(pool, SOURCE_TENANT);
      const result = await importInto(pool, TARGET_TENANT, text);

      expect(result.tables).toEqual(tables);
      expect(result.rows).toBe(0);
      expect(tables).toEqual((await discoverDataTablesWithColumns(pool)).map(t => t.name));
    });

    it('round-trips values containing tabs, newlines and backslashes', async () => {
      const tricky = 'tab\there\nline\\backslash';
      await pool.query(`INSERT INTO templates ("_id", "name", "tenant_id") VALUES ($1, $2, $3)`, [
        'tpl-tricky',
        tricky,
        SOURCE_TENANT,
      ]);

      const { text } = await exportTenant(pool, SOURCE_TENANT);
      await importInto(pool, TARGET_TENANT, text);

      const rows = await pool.query(`SELECT name FROM templates WHERE "tenant_id" = $1`, [
        TARGET_TENANT,
      ]);
      expect(rows.rows).toEqual([{ name: tricky }]);
    });

    it('does not import ephemeral tables (captchas, password_recoveries)', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);
      await importInto(pool, TARGET_TENANT, text);

      const [captchas, recoveries] = await Promise.all([
        pool.query(`SELECT 1 FROM captchas WHERE "tenant_id" = $1`, [TARGET_TENANT]),
        pool.query(`SELECT 1 FROM password_recoveries WHERE "tenant_id" = $1`, [TARGET_TENANT]),
      ]);
      expect(captchas.rowCount).toBe(0);
      expect(recoveries.rowCount).toBe(0);
    });

    it('reports per-table progress with row counts', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);
      const events: TenantTableProgress[] = [];

      await new PgTenantBackup(pool).import(TARGET_TENANT, Readable.from([text]), {
        onProgress: event => events.push(event),
      });

      const templates = events.filter(e => e.table === 'templates');
      expect(templates).toMatchObject([
        { table: 'templates', rows: 1, done: false },
        { table: 'templates', rows: 1, done: true },
      ]);
    });

    describe('rejects', () => {
      it('a stream whose schema version differs from the database', async () => {
        await seedSource(pool, SOURCE_TENANT);
        const { text } = await exportTenant(pool, SOURCE_TENANT);

        await expect(
          new PgTenantBackup(pool, async () => 9999).import(TARGET_TENANT, Readable.from([text]))
        ).rejects.toBeInstanceOf(SchemaVersionMismatchError);
      });

      it('a manifest that names a non-tenant table', async () => {
        const stream = `${JSON.stringify({
          version: 1,
          sourceTenant: SOURCE_TENANT,
          schemaVersion: 5,
          tables: [{ name: 'tenants', columns: ['tenant_id'] }],
        })}\n`;

        await expect(
          backupAtVersion(pool, 5).import(TARGET_TENANT, Readable.from([stream]))
        ).rejects.toBeInstanceOf(UnknownTableInManifestError);
      });

      it('a manifest that names an ephemeral table', async () => {
        const stream = `${JSON.stringify({
          version: 1,
          sourceTenant: SOURCE_TENANT,
          schemaVersion: 5,
          tables: [{ name: 'captchas', columns: ['tenant_id', 'x'] }],
        })}\n`;

        await expect(
          backupAtVersion(pool, 5).import(TARGET_TENANT, Readable.from([stream]))
        ).rejects.toBeInstanceOf(UnknownTableInManifestError);
      });

      it('a stream that ends before the first table finishes', async () => {
        const templates = (await discoverDataTablesWithColumns(pool)).find(
          t => t.name === 'templates'
        )!;
        const stream = `${JSON.stringify({
          version: 1,
          sourceTenant: SOURCE_TENANT,
          schemaVersion: 5,
          tables: [templates],
        })}\n`;

        await expect(
          backupAtVersion(pool, 5).import(TARGET_TENANT, Readable.from([stream]))
        ).rejects.toBeInstanceOf(PrematureEndOfStreamError);
      });
    });
  });

  describe('import: jobs', () => {
    it('regenerates ids, retargets tenant scope, and skips system jobs', async () => {
      await seedJobs(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);
      await importInto(pool, TARGET_TENANT, text);
      await expectClonedJobs(pool, SOURCE_TENANT, TARGET_TENANT);
    });
  });
});
