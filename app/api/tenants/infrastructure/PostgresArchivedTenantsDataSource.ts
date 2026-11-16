import type { Knex } from 'knex';
import type {
  ArchivedTenantRecord,
  ArchivedTenantsDataSource,
} from '../application/contracts/ArchivedTenantsDataSource.js';
import { ARCHIVED_JSONB_COLUMNS, ARCHIVED_TENANT_RECORD_COLUMNS } from './archivedTenantsTable.js';

/**
 * The Postgres backend: the `archived_tenants` table. `archivedAt` is `BIGINT`, so the newest-first
 * sort is a plain ordering; NULLs (rows whose snapshot had no readable timestamp) go last, as the
 * Mongo conversion does.
 */
class PostgresArchivedTenantsDataSource implements ArchivedTenantsDataSource {
  constructor(private readonly knex: () => Knex) {}

  async newestFirst(): Promise<ArchivedTenantRecord[]> {
    const rows = await this.knex()('archived_tenants')
      .orderByRaw('"archivedAt" DESC NULLS LAST')
      .orderBy('name', 'asc');
    return rows.map(row => PostgresArchivedTenantsDataSource.toRecord(row));
  }

  async getByName(name: string): Promise<ArchivedTenantRecord | undefined> {
    const row = await this.knex()('archived_tenants').where({ name }).first();
    return row ? PostgresArchivedTenantsDataSource.toRecord(row) : undefined;
  }

  /** Every column is written, so a field the row no longer has goes back to NULL. */
  async upsert(name: string, row: ArchivedTenantRecord): Promise<ArchivedTenantRecord> {
    await this.knex()('archived_tenants')
      .insert({
        name,
        ...PostgresArchivedTenantsDataSource.toRow(row),
        updatedAt: this.knex().fn.now(),
      })
      .onConflict('name')
      .merge();

    return (await this.getByName(name)) as ArchivedTenantRecord;
  }

  async delete(name: string): Promise<boolean> {
    return (await this.knex()('archived_tenants').where({ name }).del()) > 0;
  }

  /** A field the row does not have is left out, never `null`. */
  private static toRecord(row: Record<string, unknown>): ArchivedTenantRecord {
    const record: ArchivedTenantRecord = {};

    ARCHIVED_TENANT_RECORD_COLUMNS.forEach(column => {
      const value = row[column];
      if (value !== null && value !== undefined) {
        record[column] = value;
      }
    });

    return record;
  }

  /** `name` is handled separately as the primary key. */
  private static toRow(record: ArchivedTenantRecord): Record<string, unknown> {
    return Object.fromEntries(
      ARCHIVED_TENANT_RECORD_COLUMNS.filter(column => column !== 'name').map(column => {
        const value = (record as Record<string, unknown>)[column];
        if (value === undefined) {
          return [column, null];
        }
        return [column, ARCHIVED_JSONB_COLUMNS.includes(column) ? JSON.stringify(value) : value];
      })
    );
  }
}

export { PostgresArchivedTenantsDataSource };
