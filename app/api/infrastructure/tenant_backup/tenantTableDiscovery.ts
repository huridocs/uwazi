import type { Pool } from 'pg';

/**
 * Tenant-scoped tables that are not tenant *data*: ephemeral security artifacts. Export/import
 * skip them; clean still wipes them (its job is an empty tenant, not a backup). Everything else
 * with a tenant_id column is exported, in-flight operation state (`csv_imports` staging tables,
 * `px_entities_status`) and the `jobs` queue included, so a mid-process tenant can be restored
 * and resume where it stopped.
 */
export const EXCLUDED_TABLES = new Set(['captchas', 'password_recoveries']);

export type TableWithColumns = { name: string; columns: string[] };

/**
 * Every public table with a tenant_id column, in alphabetical order. The same query the runtime
 * uses to discover tenant scope; pg_migrations is already out (no tenant_id).
 */
export async function discoverTenantTables(pool: Pool): Promise<string[]> {
  const result = await pool.query<{ table_name: string }>(`
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
    ORDER BY table_name
  `);
  return result.rows.map(r => r.table_name);
}

/**
 * Tenant data tables (tenant_id tables minus the in-flight exclusions) with their columns in a
 * stable order: `tenant_id` first, then the rest in ordinal position. `tenant_id` first is what
 * lets import rewrite it without parsing the rest of each COPY row.
 */
export async function discoverDataTablesWithColumns(pool: Pool): Promise<TableWithColumns[]> {
  const result = await pool.query<{ table_name: string; column_name: string }>(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'tenant_id'
      )
    ORDER BY table_name, ordinal_position
  `);

  const columnsByTable = new Map<string, string[]>();
  for (const row of result.rows) {
    const columns = columnsByTable.get(row.table_name) ?? [];
    columns.push(row.column_name);
    columnsByTable.set(row.table_name, columns);
  }

  return [...columnsByTable.entries()]
    .filter(([name]) => !EXCLUDED_TABLES.has(name))
    .map(([name, columns]) => ({
      name,
      columns: ['tenant_id', ...columns.filter(column => column !== 'tenant_id')],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Primary key columns of every public table, in key order. Ordering an export by them makes the
 * stream deterministic, so a regenerated dump diffs cleanly.
 */
export async function discoverPrimaryKeys(pool: Pool): Promise<Map<string, string[]>> {
  const result = await pool.query<{ table_name: string; column_name: string }>(`
    SELECT c.relname AS table_name, a.attname AS column_name
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, position)
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
    WHERE i.indisprimary AND n.nspname = 'public'
    ORDER BY c.relname, k.position
  `);

  const keys = new Map<string, string[]>();
  for (const row of result.rows) {
    keys.set(row.table_name, [...(keys.get(row.table_name) ?? []), row.column_name]);
  }
  return keys;
}
