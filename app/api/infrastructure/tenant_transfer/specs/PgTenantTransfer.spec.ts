import { Writable, Readable } from 'stream';
import type { Pool } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PrematureEndOfStreamError } from '../PrematureEndOfStreamError.js';
import { UnknownTableInManifestError } from '../UnknownTableInManifestError.js';
import { PgTenantTransfer } from '../PgTenantTransfer.js';
import type { TenantTableProgress } from '../PgTenantTransfer.js';
import { discoverDataTablesWithColumns } from '../tenantTableDiscovery.js';

const SOURCE_TENANT = 'source-tenant';
const TARGET_TENANT = 'target-tenant';

/** A Writable that collects what was written, to feed straight back as the import stream. */
class CaptureStream extends Writable {
  text = '';

  _write(chunk: Buffer, _encoding: string, callback: () => void) {
    this.text += chunk.toString();
    callback();
  }
}

const manifestOf = (stream: string): { tables: { name: string }[] } =>
  JSON.parse(stream.slice(0, stream.indexOf('\n')));

async function seedSource(pool: Pool, tenantId: string): Promise<void> {
  await pool.query(`INSERT INTO templates ("_id", "name", "tenant_id") VALUES ($1, $2, $3)`, [
    'tpl-1',
    'Document',
    tenantId,
  ]);
  await pool.query(
    `INSERT INTO settings ("tenant_id", "_id", "site_name", "sync") VALUES ($1, $2, $3, $4)`,
    [tenantId, 'settings-1', 'Uwazi', JSON.stringify({ url: 'https://example.com' })]
  );
  await pool.query(
    `INSERT INTO ix_extractors ("_id", "tenant_id", "name", "property", "source")
     VALUES ($1, $2, $3, $4, $5)`,
    ['ext-1', tenantId, 'Extractor', 'title', '{}']
  );
  await pool.query(
    `INSERT INTO ix_models ("_id", "tenant_id", "extractorId") VALUES ($1, $2, $3)`,
    ['model-1', tenantId, 'ext-1']
  );
  // In-flight / transient tables: skipped by export/import, wiped by clean.
  await pool.query(
    `INSERT INTO captchas ("_id", "tenant_id", "text", "expiresAt") VALUES ($1, $2, $3, $4)`,
    ['cap-1', tenantId, 'ABC', '2030-01-01T00:00:00Z']
  );
  await pool.query(
    `INSERT INTO px_entities_status ("_id", "tenant_id", "entitySharedId", "extractorId", "status")
     VALUES ($1, $2, $3, $4, $5)`,
    ['px-1', tenantId, 'ent-1', 'ext-1', 'processing']
  );
}

async function clearTables(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM ix_extractors');
  await pool.query('DELETE FROM captchas');
  await pool.query('DELETE FROM px_entities_status');
}

async function exportTenant(
  pool: Pool,
  tenantId: string
): Promise<{ text: string; tables: string[] }> {
  const capture = new CaptureStream();
  const tables = await new PgTenantTransfer(pool).export(tenantId, capture);
  return { text: capture.text, tables };
}

async function importInto(pool: Pool, tenantId: string, text: string) {
  return new PgTenantTransfer(pool).import(tenantId, Readable.from([text]));
}

describe('PgTenantTransfer', () => {
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

      const transfer = new PgTenantTransfer(pool);
      const first = await transfer.clean(SOURCE_TENANT);

      expect(first.deletedRows).toBe(6);
      expect(first.tables).toContain('templates');
      expect(first.tables).toContain('captchas');

      const leftovers = await pool.query(`SELECT 1 FROM ix_extractors WHERE "tenant_id" = $1`, [
        SOURCE_TENANT,
      ]);
      expect(leftovers.rowCount).toBe(0);

      const second = await transfer.clean(SOURCE_TENANT);
      expect(second.deletedRows).toBe(0);
    });

    it('leaves another tenant untouched', async () => {
      await seedSource(pool, SOURCE_TENANT);

      await new PgTenantTransfer(pool).clean(TARGET_TENANT);

      const source = await pool.query(`SELECT 1 FROM templates WHERE "tenant_id" = $1`, [
        SOURCE_TENANT,
      ]);
      expect(source.rowCount).toBe(1);
    });
  });

  describe('export', () => {
    it('streams a manifest of data tables, skipping in-flight tables', async () => {
      await seedSource(pool, SOURCE_TENANT);

      const { text, tables } = await exportTenant(pool, SOURCE_TENANT);
      const manifest = manifestOf(text);

      expect(tables).toEqual(manifest.tables.map(t => t.name));
      expect(tables).toContain('templates');
      expect(tables).not.toContain('captchas');
      expect(tables).not.toContain('px_entities_status');
    });

    it('reports per-table progress with row counts and table total', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const events: TenantTableProgress[] = [];
      const capture = new CaptureStream();

      await new PgTenantTransfer(pool).export(SOURCE_TENANT, capture, event => events.push(event));

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

      await new PgTenantTransfer(pool).export(SOURCE_TENANT, capture, event => events.push(event));

      const templates = events.filter(e => e.table === 'templates');
      expect(templates).toMatchObject([
        { table: 'templates', rows: 1, done: false },
        { table: 'templates', rows: 1001, done: false },
        { table: 'templates', rows: 1500, done: true },
      ]);
    });
  });

  describe('import', () => {
    it('rewrites tenant_id to the target and clears settings.sync', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);

      const result = await importInto(pool, TARGET_TENANT, text);

      expect(result.sourceTenant).toBe(SOURCE_TENANT);
      expect(result.rows).toBe(4);

      const templates = await pool.query(`SELECT name FROM templates WHERE "tenant_id" = $1`, [
        TARGET_TENANT,
      ]);
      expect(templates.rows).toEqual([{ name: 'Document' }]);

      const settings = await pool.query(`SELECT sync FROM settings WHERE "tenant_id" = $1`, [
        TARGET_TENANT,
      ]);
      expect(settings.rows).toEqual([{ sync: null }]);
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

    it('does not import in-flight tables', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);
      await importInto(pool, TARGET_TENANT, text);

      const captchas = await pool.query(`SELECT 1 FROM captchas WHERE "tenant_id" = $1`, [
        TARGET_TENANT,
      ]);
      expect(captchas.rowCount).toBe(0);
    });

    it('reports per-table progress with row counts', async () => {
      await seedSource(pool, SOURCE_TENANT);
      const { text } = await exportTenant(pool, SOURCE_TENANT);
      const events: TenantTableProgress[] = [];

      await new PgTenantTransfer(pool).import(TARGET_TENANT, Readable.from([text]), event =>
        events.push(event)
      );

      const templates = events.filter(e => e.table === 'templates');
      expect(templates).toMatchObject([
        { table: 'templates', rows: 1, done: false },
        { table: 'templates', rows: 1, done: true },
      ]);
    });

    it('rejects a manifest that names a non-tenant table', async () => {
      const stream = `${JSON.stringify({
        version: 1,
        sourceTenant: SOURCE_TENANT,
        tables: [{ name: 'tenants', columns: ['tenant_id'] }],
      })}\n`;

      await expect(importInto(pool, TARGET_TENANT, stream)).rejects.toBeInstanceOf(
        UnknownTableInManifestError
      );
    });

    it('rejects a stream that ends before the first table finishes', async () => {
      const stream = `${JSON.stringify({
        version: 1,
        sourceTenant: SOURCE_TENANT,
        tables: [{ name: 'templates', columns: ['tenant_id', '_id', 'name'] }],
      })}\n`;

      await expect(importInto(pool, TARGET_TENANT, stream)).rejects.toBeInstanceOf(
        PrematureEndOfStreamError
      );
    });
  });
});
