import { Knex } from 'knex';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type SyncCursor = {
  lastSyncs: Record<string, number>;
  consecutiveFailures: number;
};

type SyncRow = {
  last_syncs: Record<string, number> | string;
  consecutive_failures: number | string;
};

const tenantId = () => ExecutionContext.currentTenant.name;

const withDb = async <T>(fn: (trx: Knex) => Promise<T>) =>
  ExecutionContext.postgresTransactionManager.withConnection(fn, undefined, {
    preservePermission: true,
  });

const toCursor = (row: SyncRow): SyncCursor => ({
  lastSyncs:
    typeof row.last_syncs === 'string'
      ? (JSON.parse(row.last_syncs) as Record<string, number>)
      : row.last_syncs,
  consecutiveFailures: Number(row.consecutive_failures),
});

const postgresSyncs = {
  async ensure(name: string): Promise<void> {
    await withDb(async trx =>
      trx.raw(
        `INSERT INTO syncs ("tenant_id", "name", "last_syncs", "consecutive_failures")
         VALUES (?, ?, '{}'::jsonb, 0)
         ON CONFLICT ("tenant_id", "name") DO NOTHING`,
        [tenantId(), name]
      )
    );
  },

  async read(name: string): Promise<SyncCursor | null> {
    const result = await withDb(async trx =>
      trx.raw<{ rows: SyncRow[] }>(
        `SELECT "last_syncs", "consecutive_failures" FROM syncs
         WHERE "tenant_id" = ? AND "name" = ?`,
        [tenantId(), name]
      )
    );
    const [row] = result.rows;
    return row ? toCursor(row) : null;
  },

  async setNamespaceTimestamp(name: string, namespace: string, timestamp: number): Promise<void> {
    await withDb(async trx =>
      trx.raw(
        `UPDATE syncs SET "last_syncs" = "last_syncs" || ?::jsonb
         WHERE "tenant_id" = ? AND "name" = ?`,
        [JSON.stringify({ [namespace]: timestamp }), tenantId(), name]
      )
    );
  },

  async resetConsecutiveFailures(name: string): Promise<void> {
    await withDb(async trx =>
      trx.raw(
        `UPDATE syncs SET "consecutive_failures" = 0
         WHERE "tenant_id" = ? AND "name" = ?`,
        [tenantId(), name]
      )
    );
  },

  async recordFailure(name: string): Promise<number> {
    const result = await withDb(async trx =>
      trx.raw<{ rows: { consecutive_failures: number | string }[] }>(
        `INSERT INTO syncs ("tenant_id", "name", "last_syncs", "consecutive_failures")
         VALUES (?, ?, '{}'::jsonb, 1)
         ON CONFLICT ("tenant_id", "name")
         DO UPDATE SET "consecutive_failures" = syncs."consecutive_failures" + 1
         RETURNING "consecutive_failures"`,
        [tenantId(), name]
      )
    );
    const [row] = result.rows;
    return Number(row.consecutive_failures);
  },
};

export { postgresSyncs };
