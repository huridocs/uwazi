import { Readable, Writable } from 'stream';
import type { Pool } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import type { Tenant } from '#api/tenants/tenantContext.js';
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
  featureFlags: { postgresCore: true },
});

/** A Writable that collects what was written, to feed back as the import stream. */
class CaptureStream extends Writable {
  text = '';

  _write(chunk: Buffer, _encoding: string, callback: () => void) {
    this.text += chunk.toString();
    callback();
  }
}

/** A stderr-like stream reporting isTTY, so progress uses the interactive two-line path. */
const ttyCapture = (): CaptureStream & { isTTY: boolean } =>
  Object.assign(new CaptureStream(), { isTTY: true });

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

describe('tenant backup progress', () => {
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

  describe('export', () => {
    it('writes progress to stderr when enabled, keeping stdout clean', async () => {
      await seed(pool, SOURCE_TENANT);
      const stdout = new CaptureStream();
      const stderr = ttyCapture();

      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout, stderr, progress: true }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      expect(stderr.text).toContain('exporting templates… 1 row');
      expect(stderr.text).toContain('tables exported 1 of');
      expect(stderr.text).toMatch(/tables exported \d+ of \d+ ✓/);
      expect(stderr.text).not.toContain('exported templates');
      expect(stdout.text).not.toContain('exporting');
    });

    it('writes no progress when disabled', async () => {
      await seed(pool, SOURCE_TENANT);
      const stdout = new CaptureStream();
      const stderr = new CaptureStream();

      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout, stderr, progress: false }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      expect(stderr.text).toBe('');
    });

    it('stays silent when stdout is a pipe, even on a terminal stderr', async () => {
      await seed(pool, SOURCE_TENANT);
      const stdout = Object.assign(new CaptureStream(), { isPipe: true });
      const stderr = ttyCapture();

      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout, stderr }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      expect(stderr.text).toBe('');
      expect(stdout.text.length).toBeGreaterThan(0);
    });

    it('writes progress when stdout is redirected to a file', async () => {
      await seed(pool, SOURCE_TENANT);
      const stdout = new CaptureStream();
      const stderr = ttyCapture();

      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout, stderr }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      expect(stderr.text).toContain('tables exported 1 of');
      expect(stdout.text.length).toBeGreaterThan(0);
    });
  });

  describe('import', () => {
    it('writes progress to stderr when enabled, including reindex', async () => {
      await seed(pool, SOURCE_TENANT);
      const exportStream = new CaptureStream();
      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout: exportStream }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      const stderr = ttyCapture();
      const reindex = jest.fn(async () => undefined);
      await testingEnvironment.runWithContext(
        () =>
          ImportTenantController.handle(
            {},
            {
              pool,
              stdin: Readable.from([exportStream.text]),
              stderr,
              progress: true,
              reindex,
            }
          ),
        { tenant: tenantFor(TARGET_TENANT) }
      );

      expect(stderr.text).toContain('importing templates… 1 row');
      expect(stderr.text).toContain('tables imported 1 of');
      expect(stderr.text).toContain('reindexing target-tenant…');
      expect(stderr.text).not.toContain('imported templates');
    });

    it('reports cleaning before importing when clear is set', async () => {
      await seed(pool, SOURCE_TENANT);
      const exportStream = new CaptureStream();
      await testingEnvironment.runWithContext(
        () => ExportTenantController.handle({ pool, stdout: exportStream }),
        { tenant: tenantFor(SOURCE_TENANT) }
      );

      const stderr = ttyCapture();
      await testingEnvironment.runWithContext(
        () =>
          ImportTenantController.handle(
            { clear: true },
            {
              pool,
              stdin: Readable.from([exportStream.text]),
              stderr,
              progress: true,
              reindex: jest.fn(async () => undefined),
            }
          ),
        { tenant: tenantFor(TARGET_TENANT) }
      );

      expect(stderr.text).toContain('cleaning target-tenant ✓');
      expect(stderr.text).toContain('importing templates… 1 row');
      expect(stderr.text).toMatch(/tables imported \d+ of \d+ ✓/);
      expect(stderr.text).toContain('reindexing target-tenant…');
    });
  });
});
