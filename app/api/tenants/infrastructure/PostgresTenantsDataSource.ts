import type { Knex } from 'knex';
import type {
  TenantPatch,
  TenantRecord,
  TenantsDataSource,
} from '../application/contracts/TenantsDataSource.js';
import { applyTenantPatch } from './applyTenantPatch.js';
import { JSONB_COLUMNS, TENANT_RECORD_COLUMNS } from './tenantsTable.js';
import type { TenantRow } from './tenantsTable.js';

const isEmptyFlags = (value: unknown) =>
  typeof value === 'object' && value !== null && Object.keys(value).length === 0;

class PostgresTenantsDataSource implements TenantsDataSource {
  /**
   * The registry sits above every tenant, so it is read through the plain connection and not
   * through a tenant scoped table. Resolved per call, like the Mongo adapter's database.
   */
  constructor(private readonly knex: () => Knex) {}

  async all(): Promise<TenantRecord[]> {
    const rows = await PostgresTenantsDataSource.table(this.knex()).orderBy('name');
    return rows.map(row => PostgresTenantsDataSource.toRecord(row));
  }

  async getByName(name: string): Promise<TenantRecord | undefined> {
    const row = await PostgresTenantsDataSource.table(this.knex()).where({ name }).first();
    return row ? PostgresTenantsDataSource.toRecord(row) : undefined;
  }

  async upsert(name: string, patch: TenantPatch): Promise<TenantRecord> {
    return this.knex().transaction(async trx => {
      const row = await PostgresTenantsDataSource.table(trx).where({ name }).forUpdate().first();
      const record = applyTenantPatch(
        row ? PostgresTenantsDataSource.toRecord(row) : undefined,
        name,
        patch
      );

      // `extras` is left out on purpose: it holds what other tools stored, and a merge only
      // touches the columns it is given.
      await trx('tenants')
        .insert({ ...PostgresTenantsDataSource.toRow(record), updatedAt: trx.fn.now() })
        .onConflict('name')
        .merge();

      return record;
    });
  }

  async delete(name: string): Promise<boolean> {
    return (await PostgresTenantsDataSource.table(this.knex()).where({ name }).del()) > 0;
  }

  private static table(knex: Knex | Knex.Transaction) {
    return knex<TenantRow>('tenants');
  }

  /**
   * A field the row does not have is left out, never `null`: `null` would clobber defaults. What
   * other tools stored under `extras` comes back at the top level, as the Mongo row has it.
   */
  private static toRecord(row: TenantRow): TenantRecord {
    const record: Record<string, unknown> = { ...row.extras };

    TENANT_RECORD_COLUMNS.forEach(column => {
      const value = row[column];
      if (
        value !== null &&
        value !== undefined &&
        !(column === 'featureFlags' && isEmptyFlags(value))
      ) {
        record[column] = value;
      }
    });

    return record as TenantRecord;
  }

  /** Every column is written, so a field the record no longer has goes back to `NULL`. */
  private static toRow(record: TenantRecord): Record<string, unknown> {
    return Object.fromEntries(
      TENANT_RECORD_COLUMNS.map(column => {
        const value = (record as Record<string, unknown>)[column];
        if (column === 'featureFlags') return [column, JSON.stringify(value ?? {})];
        if (value === undefined) return [column, null];
        // `pg` sends a JS array as a Postgres array, which is not JSON.
        return [column, JSONB_COLUMNS.includes(column) ? JSON.stringify(value) : value];
      })
    );
  }
}

export { PostgresTenantsDataSource };
