import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { Statements, type StatementResult } from '../common/Statement.js';

type PreserveCursor = {
  lastImport: string;
};

type PreserveRow = {
  last_import: string;
};

const tenantId = () => ExecutionContext.currentTenant.name;

const query = async <TRow = Record<string, unknown>>(
  sql: string,
  bindings: readonly unknown[]
): Promise<StatementResult<TRow>> =>
  ExecutionContext.postgresTransactionManager.query<TRow>(Statements.raw(sql, bindings, 'inherit'));

const postgresPreserveSync = {
  async read(token: string): Promise<PreserveCursor | null> {
    const result = await query<PreserveRow>(
      `SELECT "last_import" FROM preserve_sync
         WHERE "tenant_id" = ? AND "token" = ?`,
      [tenantId(), token]
    );
    const [row] = result.rows;
    return row ? { lastImport: row.last_import } : null;
  },

  async save(token: string, lastImport: string): Promise<void> {
    await query(
      `INSERT INTO preserve_sync ("tenant_id", "token", "last_import")
         VALUES (?, ?, ?)
         ON CONFLICT ("tenant_id", "token")
         DO UPDATE SET "last_import" = EXCLUDED."last_import"`,
      [tenantId(), token, lastImport]
    );
  },
};

export { postgresPreserveSync };
