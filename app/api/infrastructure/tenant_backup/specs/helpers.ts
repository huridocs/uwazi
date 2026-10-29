import { Readable, Writable } from 'stream';
import type { Pool } from 'pg';
import { PgTenantBackup } from '../PgTenantBackup.js';

export const SOURCE_TENANT = 'source-tenant';
export const TARGET_TENANT = 'target-tenant';

/** A Writable that collects what was written, to feed straight back as the import stream. */
export class CaptureStream extends Writable {
  text = '';

  _write(chunk: Buffer, _encoding: string, callback: () => void) {
    this.text += chunk.toString();
    callback();
  }
}

export const manifestOf = (
  stream: string
): { version: number; sourceTenant: string; schemaVersion: number; tables: { name: string }[] } =>
  JSON.parse(stream.slice(0, stream.indexOf('\n')));

export async function seedSource(pool: Pool, tenantId: string): Promise<void> {
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
  // Ephemeral security artifacts: skipped by export/import, wiped by clean.
  await pool.query(
    `INSERT INTO captchas ("_id", "tenant_id", "text", "expiresAt") VALUES ($1, $2, $3, $4)`,
    ['cap-1', tenantId, 'ABC', '2030-01-01T00:00:00Z']
  );
  await pool.query(
    `INSERT INTO password_recoveries ("_id", "tenant_id", "key", "userId", "expiresAt")
     VALUES ($1, $2, $3, $4, $5)`,
    ['pw-1', tenantId, 'secret', 'user-1', '2030-01-01T00:00:00Z']
  );
  // In-flight operation state: exported/imported so a mid-process tenant can resume.
  await pool.query(
    `INSERT INTO px_entities_status ("_id", "tenant_id", "entitySharedId", "extractorId", "status")
     VALUES ($1, $2, $3, $4, $5)`,
    ['px-1', tenantId, 'ent-1', 'ext-1', 'processing']
  );
  await pool.query(
    `INSERT INTO csv_imports
       ("_id", "tenant_id", "template_id", "status", "created_by", "created_at", "updated_at", "file")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    ['csv-1', tenantId, 'tpl-1', 'processing', 'user-1', 1, 1, '{}']
  );
}

/** Jobs live in a shared table with a globally-unique id, so they are seeded separately. */
export async function seedJobs(pool: Pool, tenantId: string): Promise<void> {
  // A tenant job, scoped by namespace (and tenant_id) — exported/imported.
  await pool.query(
    `INSERT INTO jobs
       ("id", "queue", "name", "namespace", "params", "lockedUntil", "createdAt", "retryCount", "failed", "options", "tenant_id")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      'job-1',
      'queue name',
      'CsvImportEntitiesJob',
      tenantId,
      JSON.stringify({ tenantName: tenantId, importId: 'csv-1' }),
      5,
      10,
      2,
      false,
      JSON.stringify({ lockWindow: 1000, maxRetries: 3 }),
      tenantId,
    ]
  );
  // A system job belongs to no tenant: never exported, never cleaned.
  await pool.query(
    `INSERT INTO jobs
       ("id", "queue", "name", "namespace", "params", "lockedUntil", "createdAt", "retryCount", "failed", "options", "tenant_id")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      'job-system',
      'queue name',
      'MigrationJob',
      'system',
      '{}',
      0,
      1,
      0,
      false,
      JSON.stringify({ lockWindow: 1000, maxRetries: 3 }),
      null,
    ]
  );
}

export async function clearTables(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM ix_extractors');
  await pool.query('DELETE FROM captchas');
  await pool.query('DELETE FROM password_recoveries');
  await pool.query('DELETE FROM px_entities_status');
  await pool.query('DELETE FROM csv_imports');
  await pool.query('DELETE FROM jobs');
}

export async function exportTenant(
  pool: Pool,
  tenantId: string
): Promise<{ text: string; tables: string[] }> {
  const capture = new CaptureStream();
  const tables = await new PgTenantBackup(pool).export(tenantId, capture);
  return { text: capture.text, tables };
}

export async function importInto(pool: Pool, tenantId: string, text: string) {
  return new PgTenantBackup(pool).import(tenantId, Readable.from([text]));
}

/** Asserts the seeded templates and settings landed in `tenantId` with the expected sync value. */
export async function expectRestoredContent(
  pool: Pool,
  tenantId: string,
  sync: Record<string, unknown> | null
): Promise<void> {
  const templates = await pool.query(`SELECT name FROM templates WHERE "tenant_id" = $1`, [
    tenantId,
  ]);
  expect(templates.rows).toEqual([{ name: 'Document' }]);

  const settings = await pool.query(`SELECT sync FROM settings WHERE "tenant_id" = $1`, [tenantId]);
  expect(settings.rows).toEqual([{ sync }]);
}

/**
 * Asserts a clone imported its jobs without colliding: a fresh id, retargeted namespace/tenant_id,
 * verbatim params and operational fields, the source untouched, system jobs skipped.
 */
export async function expectClonedJobs(
  pool: Pool,
  sourceTenant: string,
  targetTenant: string
): Promise<void> {
  const { rows } = await pool.query(`SELECT * FROM jobs ORDER BY "createdAt", "id"`);
  expect(rows).toHaveLength(3);

  const [source, target, system] = [
    rows.find(row => row.tenant_id === sourceTenant),
    rows.find(row => row.tenant_id === targetTenant),
    rows.find(row => row.tenant_id === null),
  ];
  expect(source).toBeDefined();
  expect(target).toBeDefined();

  expect(system).toMatchObject({ id: 'job-system', namespace: 'system' });
  expect(target.id).not.toBe(source.id);

  expect(target).toMatchObject({
    namespace: targetTenant,
    tenant_id: targetTenant,
    params: { tenantName: sourceTenant, importId: 'csv-1' },
    lockedUntil: '5',
    createdAt: '10',
    retryCount: 2,
    failed: false,
    options: { lockWindow: 1000, maxRetries: 3 },
  });

  expect(source).toMatchObject({
    id: 'job-1',
    namespace: sourceTenant,
    tenant_id: sourceTenant,
    params: { tenantName: sourceTenant, importId: 'csv-1' },
  });
}

/** A backup that reports a pinned schema version, for specs that hand-craft manifest lines. */
export function backupAtVersion(pool: Pool, version: number): PgTenantBackup {
  return new PgTenantBackup(pool, async () => version);
}
