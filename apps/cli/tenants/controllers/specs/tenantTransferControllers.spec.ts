import { Readable, Writable } from 'stream';
import type { Pool } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { Tenant } from '#api/tenants/tenantContext.js';
import { CleanTenantController } from '../CleanTenantController.js';
import { ExportTenantController } from '../ExportTenantController.js';
import { ImportTenantController } from '../ImportTenantController.js';

const SOURCE_TENANT = 'source-tenant';
const TARGET_TENANT = 'target-tenant';

const tenantFor = (name: string): Tenant => ({
  name,
  dbName: '',
  indexName: '',
  uploadedDocuments: '',
  attachments: '',
  customUploads: '',
  activityLogs: '',
  domain: '',
});

/** A Writable that collects what was written, to feed back as the import stream. */
class CaptureStream extends Writable {
  text = '';

  _write(chunk: Buffer, _encoding: string, callback: () => void) {
    this.text += chunk.toString();
    callback();
  }
}

async function seed(pool: Pool, tenantId: string): Promise<void> {
  await pool.query(`INSERT INTO templates ("_id", "name", "tenant_id") VALUES ($1, $2, $3)`, [
    'tpl-1',
    'Document',
    tenantId,
  ]);
  await pool.query(
    `INSERT INTO settings ("tenant_id", "_id", "site_name", "sync") VALUES ($1, $2, $3, $4)`,
    [tenantId, 'settings-1', 'Uwazi', JSON.stringify({ url: 'https://example.com' })]
  );
}

async function clear(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
}

describe('tenant transfer controllers', () => {
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
    await clear(pool);
  });

  afterEach(async () => {
    await clear(pool);
  });

  it('clean deletes the current tenant data', async () => {
    await seed(pool, SOURCE_TENANT);

    const output = await testingEnvironment.runWithContext(
      () => CleanTenantController.handle({ pool }),
      { tenant: tenantFor(SOURCE_TENANT) }
    );

    expect(output.tables).toContain('templates');
    expect(output.deletedRows).toBe(2);

    const rows = await pool.query('SELECT 1 FROM templates WHERE "tenant_id" = $1', [
      SOURCE_TENANT,
    ]);
    expect(rows.rowCount).toBe(0);
  });

  it('export writes the COPY stream to the given stdout', async () => {
    await seed(pool, SOURCE_TENANT);

    const capture = new CaptureStream();
    await testingEnvironment.runWithContext(
      () => ExportTenantController.handle({ pool, stdout: capture }),
      { tenant: tenantFor(SOURCE_TENANT) }
    );

    expect(capture.text.length).toBeGreaterThan(0);
    expect(capture.text).toContain('templates');
  });

  describe('import', () => {
    it('loads a stream into the current tenant and reindexes it', async () => {
      await seed(pool, SOURCE_TENANT);
      const capture = new CaptureStream();
      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout: capture }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      const reindex = jest.fn(async () => undefined);
      const output = await testingEnvironment.runWithContext(
        () =>
          ImportTenantController.handle(
            {},
            {
              pool,
              stdin: Readable.from([capture.text]),
              reindex,
            }
          ),
        { tenant: tenantFor(TARGET_TENANT) }
      );

      expect(output.sourceTenant).toBe(SOURCE_TENANT);
      expect(output.tables).toContain('templates');
      expect(reindex).toHaveBeenCalledWith(TARGET_TENANT);

      const settings = await pool.query('SELECT sync FROM settings WHERE "tenant_id" = $1', [
        TARGET_TENANT,
      ]);
      expect(settings.rows).toEqual([{ sync: null }]);
    });

    it('cleans the target first when clear is set', async () => {
      await seed(pool, SOURCE_TENANT);
      const capture = new CaptureStream();
      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout: capture }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      await pool.query(`INSERT INTO templates ("_id", "name", "tenant_id") VALUES ($1, $2, $3)`, [
        'tpl-stale',
        'Stale',
        TARGET_TENANT,
      ]);

      const reindex = jest.fn(async () => undefined);
      await testingEnvironment.runWithContext(
        () =>
          ImportTenantController.handle(
            { clear: true },
            { pool, stdin: Readable.from([capture.text]), reindex }
          ),
        { tenant: tenantFor(TARGET_TENANT) }
      );

      const templates = await pool.query('SELECT name FROM templates WHERE "tenant_id" = $1', [
        TARGET_TENANT,
      ]);
      expect(templates.rows).toEqual([{ name: 'Document' }]);
      expect(reindex).toHaveBeenCalledWith(TARGET_TENANT);
    });

    it('surfaces a reindex failure after importing', async () => {
      await seed(pool, SOURCE_TENANT);
      const capture = new CaptureStream();
      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout: capture }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      const reindex = jest.fn(async () => {
        throw new Error('reindex boom');
      });

      await expect(
        testingEnvironment.runWithContext(
          () =>
            ImportTenantController.handle(
              {},
              {
                pool,
                stdin: Readable.from([capture.text]),
                reindex,
              }
            ),
          { tenant: tenantFor(TARGET_TENANT) }
        )
      ).rejects.toThrow('reindex boom');
      expect(reindex).toHaveBeenCalledWith(TARGET_TENANT);
    });
  });
});
