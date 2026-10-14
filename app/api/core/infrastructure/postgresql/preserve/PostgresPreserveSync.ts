import { Knex } from 'knex';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type PreserveCursor = {
  lastImport: string;
};

type PreserveRow = {
  last_import: string;
};

const tenantId = () => ExecutionContext.currentTenant.name;

const withDb = async <T>(fn: (trx: Knex) => Promise<T>) =>
  ExecutionContext.postgresTransactionManager.withConnection(fn, undefined, {
    preservePermission: true,
  });

const postgresPreserveSync = {
  async read(token: string): Promise<PreserveCursor | null> {
    const result = await withDb(async trx =>
      trx.raw<{ rows: PreserveRow[] }>(
        `SELECT "last_import" FROM preserve_sync
         WHERE "tenant_id" = ? AND "token" = ?`,
        [tenantId(), token]
      )
    );
    const [row] = result.rows;
    return row ? { lastImport: row.last_import } : null;
  },

  async save(token: string, lastImport: string): Promise<void> {
    await withDb(async trx =>
      trx.raw(
        `INSERT INTO preserve_sync ("tenant_id", "token", "last_import")
         VALUES (?, ?, ?)
         ON CONFLICT ("tenant_id", "token")
         DO UPDATE SET "last_import" = EXCLUDED."last_import"`,
        [tenantId(), token, lastImport]
      )
    );
  },
};

export { postgresPreserveSync };
