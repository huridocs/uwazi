import { Knex } from 'knex';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';
import { SyncLogWriter } from './SyncLogWriter.js';

export type TableConfig = {
  knex: Knex;
  tableName: string;
  tenantId: string;
  transactionManager: PostgresTransactionManager;
  syncWriter?: SyncLogWriter;
};

type ForParams = {
  tableName: string;
  tenantId: string;
  transactionManager: PostgresTransactionManager;
  knex?: Knex;
  syncWriter?: SyncLogWriter;
};

/**
 * Immutable, tenant-scoped query builder over a single Postgres table.
 *
 * Tenant isolation is enforced by Row-Level Security (see migration 004): every
 * terminal runs through `transactionManager.withConnection`, which sets
 * `app.current_tenant` on the connection.
 *
 * `tenant_id` is never returned to callers — it is stripped by `cleanRow` on
 * every read (PostgreSQL does not support `SELECT * EXCEPT col` natively).
 */
export class PostgresTable<TRow = Record<string, unknown>> {
  protected readonly cfg: TableConfig;

  private readonly qb: Knex.QueryBuilder;

  protected constructor(cfg: TableConfig, qb: Knex.QueryBuilder) {
    this.cfg = cfg;
    this.qb = qb;
  }

  static for<T = Record<string, unknown>>(params: ForParams): PostgresTable<T> {
    const knexInstance = params.knex ?? PostgresDB.knex;
    const cfg: TableConfig = {
      knex: knexInstance,
      tableName: params.tableName,
      tenantId: params.tenantId,
      transactionManager: params.transactionManager,
      syncWriter: params.syncWriter,
    };
    return new PostgresTable<T>(cfg, knexInstance(params.tableName));
  }

  get tableName(): string {
    return this.cfg.tableName;
  }

  get tenantId(): string {
    return this.cfg.tenantId;
  }

  query<T = TRow>(): this {
    return this.chain(this.cfg.knex(this.cfg.tableName)) as this;
  }

  protected chain(qb: Knex.QueryBuilder): this {
    return new (this.constructor as any)(this.cfg, qb) as this;
  }

  where(condition: Record<string, unknown>): PostgresTable<TRow> {
    return this.chain(this.qb.clone().where(condition));
  }

  whereAny(conditions: Record<string, unknown>[]): PostgresTable<TRow> {
    const qb = this.qb
      .clone()
      .where(builder =>
        conditions.forEach((condition, i) =>
          i === 0 ? builder.where(condition) : builder.orWhere(condition)
        )
      );
    return this.chain(qb);
  }

  /** Adds an OR condition. The permission wrapper isolates this in a subquery so it is safe. */
  orWhere(condition: Record<string, unknown>): PostgresTable<TRow> {
    return this.chain(this.qb.clone().orWhere(condition));
  }

  whereBetween(column: string, range: [Knex.Value, Knex.Value]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereBetween(column, range));
  }

  whereLike(column: string, pattern: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereLike(column, pattern));
  }

  whereExists(callback: (qb: Knex.QueryBuilder) => void): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereExists(callback));
  }

  having(column: string, operator: string, value: Knex.Value): PostgresTable<TRow> {
    return this.chain(this.qb.clone().having(column, operator, value));
  }

  /** OR-groups a JSONB superset (`@>`) check across multiple candidate values for one column. */
  whereJsonSupersetOfAny(column: string, values: Record<string, unknown>[]): PostgresTable<TRow> {
    const qb = this.qb.clone().where(builder => {
      values.forEach((value, i) =>
        i === 0
          ? builder.whereJsonSupersetOf(column, value)
          : builder.orWhereJsonSupersetOf(column, value)
      );
    });
    return this.chain(qb);
  }

  whereNot(column: string, value: Knex.Value): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereNot(column, value));
  }

  whereNull(column: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereNull(column));
  }

  whereNotNull(column: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereNotNull(column));
  }

  whereIn(column: string, values: Knex.Value[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereIn(column, values));
  }

  whereNotIn(column: string, values: Knex.Value[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereNotIn(column, values));
  }

  /** Escape hatch for conditions `where*` can't express, e.g. `"expiresAt" > now()`. */
  whereRaw(sql: string, bindings: readonly Knex.RawBinding[] = []): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereRaw(sql, bindings));
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): PostgresTable<TRow> {
    return this.chain(this.qb.clone().orderBy(column, direction));
  }

  limit(n: number): PostgresTable<TRow> {
    return this.chain(this.qb.clone().limit(n));
  }

  offset(n: number): PostgresTable<TRow> {
    return this.chain(this.qb.clone().offset(n));
  }

  select(columns: string[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().select(columns));
  }

  join(tableName: string, leftColumn: string, rightColumn: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().join(tableName, leftColumn, '=', rightColumn));
  }

  leftJoin(tableName: string, leftColumn: string, rightColumn: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().leftJoin(tableName, leftColumn, '=', rightColumn));
  }

  groupBy(columns: string[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().groupBy(columns));
  }

  distinct(columns: string[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().distinct(columns));
  }

  returning(columns: string[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().returning(columns));
  }

  /**
   * Hook called by every terminal method before execution.
   * Subclasses override to inject permission conditions.
   *
   * @param qb    The cloned, transaction-scoped query builder about to be executed.
   * @param operation  What kind of operation is being performed.
   * @returns The (possibly modified) query builder.
   */
  protected applyPolicy(
    qb: Knex.QueryBuilder,
    _operation: 'read' | 'write' | 'raw'
  ): Knex.QueryBuilder {
    return qb;
  }

  /**
   * Gate check for insert/upsert. Subclasses override to block anonymous users.
   * Unlike applyPolicy, this does NOT need a query builder — it's a pure predicate.
   */
  protected applyInsertPolicy(): void {}


  private async run<T>(fn: (qb: Knex.QueryBuilder) => Promise<T> | Knex.QueryBuilder): Promise<T> {
    return this.cfg.transactionManager.withConnection(async trx =>
      fn(this.qb.clone().transacting(trx))
    );
  }

  async first(): Promise<TRow | undefined> {
    const row = await this.run(qb => this.applyPolicy(qb, 'read').first());
    return row ? (PostgresTable.cleanRow(row) as TRow) : undefined;
  }

  async all(): Promise<TRow[]> {
    const rows = (await this.run(qb => this.applyPolicy(qb, 'read'))) as Record<string, unknown>[];
    return rows.map(r => PostgresTable.cleanRow(r)) as TRow[];
  }

  async count(): Promise<number> {
    const result = await this.run(qb =>
      this.applyPolicy(qb, 'read').count<{ count: string }[]>('* as count').first()
    );
    return parseInt(result?.count ?? '0', 10);
  }

  async sum(column: string): Promise<number> {
    const result = await this.run(qb =>
      this.applyPolicy(qb, 'read').sum({ total: column }).first()
    );
    return Number((result as { total?: unknown })?.total ?? 0);
  }

  async insert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    this.applyInsertPolicy();
    const rows = this.rowsWithTenant(doc);
    await this.cfg.transactionManager.withConnection(async trx =>
      trx(this.cfg.tableName).insert(rows)
    );
    await this.notifySync(rows, false);
  }

  async upsert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    this.applyInsertPolicy();
    const rows = this.rowsWithTenant(doc);
    await this.cfg.transactionManager.withConnection(async trx =>
      trx(this.cfg.tableName).insert(rows).onConflict(['_id', 'tenant_id']).merge()
    );
    await this.notifySync(rows, false);
  }

  async update(changes: Record<string, unknown>): Promise<string[]> {
    const serialized = PostgresTable.serialize(changes);
    const result = await this.run(qb =>
      this.applyPolicy(qb, 'write').returning(['_id']).update(serialized)
    );
    if (this.cfg.syncWriter) {
      await this.cfg.syncWriter.upsertSyncLogs(PostgresTable.idsOf(result), false);
    }
    return PostgresTable.idsOf(result);
  }

  async delete(): Promise<string[]> {
    const result = await this.run(qb =>
      this.applyPolicy(qb, 'write').returning(['_id']).del()
    );
    if (this.cfg.syncWriter) {
      await this.cfg.syncWriter.upsertSyncLogs(PostgresTable.idsOf(result), true);
    }
    return PostgresTable.idsOf(result);
  }

  /**
   * Escape hatch for SQL the builder cannot express (e.g. atomic JSONB mutations).
   * Runs inside a tenant-scoped connection; RLS enforces isolation.
   *
   * Uses `withConnection` directly (not `this.run`) — raw SQL must not inherit the
   * builder's accumulated WHERE/filter state from the chain.
   */
  async raw<TResult = unknown>(sql: string, bindings?: unknown): Promise<Knex.Raw<TResult>> {
    await this.run(qb => this.applyPolicy(qb, 'raw'));
    return this.cfg.transactionManager.withConnection(async trx =>
      trx.raw(sql, bindings as any)
    ) as Promise<Knex.Raw<TResult>>;
  }

  private static serialize(row: Record<string, unknown>): Record<string, unknown> {
    const serialized = { ...row };
    for (const key of Object.keys(serialized)) {
      const value = serialized[key];
      if (typeof value === 'object' && value !== null) {
        serialized[key] = JSON.stringify(value);
      }
    }
    return serialized;
  }

  private static cleanRow(row: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(row).filter(
        ([k, v]) =>
          k !== 'tenant_id' &&
          k !== '_perm_read_refs' &&
          k !== '_perm_write_refs' &&
          v !== null
      )
    );
  }

  protected async notifySync(rows: Record<string, unknown>[], deleted: boolean): Promise<void> {
    if (!this.cfg.syncWriter) return;
    const ids = rows.map(row => row._id).filter((id): id is string => typeof id === 'string');
    await this.cfg.syncWriter.upsertSyncLogs(ids, deleted);
  }

  protected rowsWithTenant(
    doc: Record<string, unknown> | Record<string, unknown>[]
  ): Record<string, unknown>[] {
    const rows = Array.isArray(doc) ? doc : [doc];
    return rows.map(r => PostgresTable.serialize({ ...r, tenant_id: this.cfg.tenantId }));
  }

  protected static idsOf(result: unknown): string[] {
    return (result as { _id: string }[]).map(r => r._id);
  }
}
