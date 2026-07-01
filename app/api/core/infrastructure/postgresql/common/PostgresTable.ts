import { Knex } from 'knex';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PostgresQueryBuilder } from './PostgresQueryBuilder.js';

export { PostgresQueryBuilder };

export class PostgresTable {
  protected knex: Knex;

  readonly tableName: string;

  readonly tenantId: string;

  private readonly jsonbColumns: string[];

  constructor(tableName: string, tenantId: string, jsonbColumns: string[] = []) {
    this.tableName = tableName;
    this.tenantId = tenantId;
    this.knex = PostgresDB.knex;
    this.jsonbColumns = jsonbColumns;
  }

  query<TRow = Record<string, unknown>>(): PostgresQueryBuilder<TRow> {
    return new PostgresQueryBuilder<TRow>(this.knex, this.tableName, this.tenantId);
  }

  /**
   * Executes raw SQL via knex.raw(). This is an escape hatch for rare cases
   * the query builder cannot express (e.g. atomic JSONB mutations).
   *
   * ⚠️ CRITICAL: The SQL MUST include a `tenant_id = ?` filter with the
   * current tenant bound in `bindings`. This method does NOT auto-inject
   * tenant isolation — missing it will leak data across tenants.
   *
   * Example:
   *   await this.table.raw(
   *     `UPDATE ?? SET ... WHERE "_id" = ? AND "tenant_id" = ?`,
   *     [this.table.tableName, id, this.table.tenantId]
   *   );
   */
  async raw<TResult = unknown>(sql: string, bindings?: unknown): Promise<Knex.Raw<TResult>> {
    const hasTenantFilter = /["']?tenant_id["']?\s*=\s*\?/i.test(sql);
    if (!hasTenantFilter) {
      throw new Error(
        'PostgresTable.raw() call is missing a tenant_id filter. ' +
          'SQL must include "tenant_id = ?" to prevent cross-tenant data leakage.'
      );
    }
    return this.knex.raw(sql, bindings as any) as Promise<Knex.Raw<TResult>>;
  }

  serializeForWrite(doc: Record<string, unknown>): Record<string, unknown> {
    return this._serializeJsonb(doc);
  }

  private _serializeJsonb(row: Record<string, unknown>): Record<string, unknown> {
    for (const col of this.jsonbColumns) {
      if (
        col in row &&
        row[col] !== null &&
        row[col] !== undefined &&
        typeof row[col] === 'object'
      ) {
        // eslint-disable-next-line no-param-reassign
        row[col] = JSON.stringify(row[col]);
      }
    }
    return row;
  }

  async insert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    const rows = Array.isArray(doc) ? doc : [doc];

    await this.knex(this.tableName).insert(
      rows.map(r => this._serializeJsonb({ ...r, tenant_id: this.tenantId }))
    );
  }

  async upsert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    const rows = Array.isArray(doc) ? doc : [doc];

    await this.knex(this.tableName)
      .insert(rows.map(r => this._serializeJsonb({ ...r, tenant_id: this.tenantId })))
      .onConflict(['_id', 'tenant_id'])
      .merge();
  }
}
