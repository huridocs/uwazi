import { Readable, Writable } from 'stream';
import type { Pool } from 'pg';
import { PgTenantTransfer } from '../PgTenantTransfer.js';

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

export async function clearTables(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM ix_extractors');
  await pool.query('DELETE FROM captchas');
  await pool.query('DELETE FROM px_entities_status');
}

export async function exportTenant(
  pool: Pool,
  tenantId: string
): Promise<{ text: string; tables: string[] }> {
  const capture = new CaptureStream();
  const tables = await new PgTenantTransfer(pool).export(tenantId, capture);
  return { text: capture.text, tables };
}

export async function importInto(pool: Pool, tenantId: string, text: string) {
  return new PgTenantTransfer(pool).import(tenantId, Readable.from([text]));
}

/** A transfer that reports a pinned schema version, for specs that hand-craft manifest lines. */
export function transferAtVersion(pool: Pool, version: number): PgTenantTransfer {
  return new PgTenantTransfer(pool, async () => version);
}
