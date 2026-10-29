import type pg from 'pg';
import { uuidv7 } from '#api/core/libs/queue/infrastructure/uuidv7.js';
import { rewriteField } from './manifest.js';
import type { ExportManifest } from './manifest.js';
import type { TableWithColumns } from './tenantTableDiscovery.js';

/** Jobs are keyed by a globally-unique id (not a tenant-scoped key), unlike every other table. */
const JOBS_TABLE = 'jobs';

/**
 * Builds the per-row rewriter for a COPY import. Every table rewrites tenant_id to the
 * destination; jobs also regenerate their id so a clone never collides with the source's
 * still-present jobs (the id is an unreferenced queue-internal key, so regenerating is safe).
 */
export function rowRewriter(table: TableWithColumns, tenantId: string): (line: string) => string {
  if (table.name !== JOBS_TABLE) {
    return line => rewriteField(line, 0, tenantId);
  }
  const idIndex = table.columns.indexOf('id');
  return line => rewriteField(rewriteField(line, 0, tenantId), idIndex, uuidv7());
}

/**
 * Clears the sync config of an imported tenant. A cross-tenant restore must not inherit the
 * source's sync server credentials; opt-in via the import `nullSync` option.
 */
export async function nullSyncConfig(
  client: pg.PoolClient,
  manifest: ExportManifest,
  tenantId: string
): Promise<void> {
  if (manifest.tables.some(table => table.name === 'settings')) {
    await client.query(`UPDATE "settings" SET "sync" = NULL WHERE "tenant_id" = $1`, [tenantId]);
  }
}

/**
 * Retargets an imported job's `namespace` to the destination. The generic queue runs a job under
 * its `namespace`, so imported jobs must carry the destination tenant there, not the source one.
 * The COPY rewrites only `tenant_id`; this reconciles `namespace` to it, leaving every operational
 * field (params, lockedUntil, retries, options, …) verbatim.
 */
export async function reconcileJobs(
  client: pg.PoolClient,
  manifest: ExportManifest,
  tenantId: string
): Promise<void> {
  if (!manifest.tables.some(table => table.name === 'jobs')) return;
  await client.query(`UPDATE "jobs" SET "namespace" = "tenant_id" WHERE "tenant_id" = $1`, [
    tenantId,
  ]);
}
