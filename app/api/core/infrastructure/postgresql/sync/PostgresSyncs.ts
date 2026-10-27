import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { Statements, type StatementResult } from '../common/Statement.js';

type SyncCursor = {
  lastSyncs: Record<string, number>;
  consecutiveFailures: number;
};

type SyncRow = {
  last_syncs: Record<string, number> | string;
  consecutive_failures: number | string;
};

const tenantId = () => ExecutionContext.currentTenant.name;

const query = async <TRow = Record<string, unknown>>(
  sql: string,
  bindings: readonly unknown[]
): Promise<StatementResult<TRow>> =>
  ExecutionContext.postgresTransactionManager.query<TRow>(Statements.raw(sql, bindings, 'inherit'));

const toCursor = (row: SyncRow): SyncCursor => ({
  lastSyncs:
    typeof row.last_syncs === 'string'
      ? (JSON.parse(row.last_syncs) as Record<string, number>)
      : row.last_syncs,
  consecutiveFailures: Number(row.consecutive_failures),
});

const postgresSyncs = {
  async ensure(name: string): Promise<void> {
    await query(
      `INSERT INTO syncs ("tenant_id", "name", "last_syncs", "consecutive_failures")
         VALUES (?, ?, '{}'::jsonb, 0)
         ON CONFLICT ("tenant_id", "name") DO NOTHING`,
      [tenantId(), name]
    );
  },

  async read(name: string): Promise<SyncCursor | null> {
    const result = await query<SyncRow>(
      `SELECT "last_syncs", "consecutive_failures" FROM syncs
         WHERE "tenant_id" = ? AND "name" = ?`,
      [tenantId(), name]
    );
    const [row] = result.rows;
    return row ? toCursor(row) : null;
  },

  async setNamespaceTimestamp(name: string, namespace: string, timestamp: number): Promise<void> {
    await query(
      `UPDATE syncs SET "last_syncs" = "last_syncs" || ?::jsonb
         WHERE "tenant_id" = ? AND "name" = ?`,
      [JSON.stringify({ [namespace]: timestamp }), tenantId(), name]
    );
  },

  async resetConsecutiveFailures(name: string): Promise<void> {
    await query(
      `UPDATE syncs SET "consecutive_failures" = 0
         WHERE "tenant_id" = ? AND "name" = ?`,
      [tenantId(), name]
    );
  },

  async recordFailure(name: string): Promise<number> {
    const result = await query<{ consecutive_failures: number | string }>(
      `INSERT INTO syncs ("tenant_id", "name", "last_syncs", "consecutive_failures")
         VALUES (?, ?, '{}'::jsonb, 1)
         ON CONFLICT ("tenant_id", "name")
         DO UPDATE SET "consecutive_failures" = syncs."consecutive_failures" + 1
         RETURNING "consecutive_failures"`,
      [tenantId(), name]
    );
    const [row] = result.rows;
    return Number(row.consecutive_failures);
  },
};

export { postgresSyncs };
