import type { Knex } from 'knex';
import type { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import type { FootprintReader } from '../../application/contracts/FootprintReader.js';

/** Usage is a system read: every row counts, whatever its permissions. */
const SYSTEM_READ = { bypass: true, refIds: [] };

/**
 * Tenants share tables, so the footprint is an estimate: the size of the tenant's rows in every
 * table that has a tenant_id. Indexes, TOAST overhead and dead tuples are not attributed.
 */
class PostgresFootprintReader implements FootprintReader {
  constructor(
    private readonly deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }
  ) {}

  async databaseBytes(): Promise<number> {
    return this.deps.pgTransactionManager.withConnection(async trx => {
      const tables = await PostgresFootprintReader.tenantTables(trx);
      if (!tables.length) {
        return 0;
      }

      const perTable = tables.map(
        () =>
          'SELECT coalesce(sum(pg_column_size(t.*)), 0) AS bytes FROM ?? t WHERE t."tenant_id" = ?'
      );
      const result = await trx.raw<{ rows: { bytes: string }[] }>(
        `SELECT coalesce(sum(bytes), 0) AS bytes FROM (${perTable.join(' UNION ALL ')}) per_table`,
        tables.flatMap(table => [table, this.deps.tenantId])
      );

      return Number(result.rows[0]?.bytes ?? 0);
    }, SYSTEM_READ);
  }

  private static async tenantTables(trx: Knex.Transaction): Promise<string[]> {
    const result = await trx.raw<{ rows: { table_name: string }[] }>(
      `SELECT c.table_name
         FROM information_schema.columns c
         JOIN information_schema.tables t
           ON t.table_schema = c.table_schema AND t.table_name = c.table_name
        WHERE c.table_schema = current_schema()
          AND c.column_name = 'tenant_id'
          AND t.table_type = 'BASE TABLE'`
    );

    return result.rows.map(row => row.table_name);
  }
}

export { PostgresFootprintReader };
