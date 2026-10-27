/* eslint-disable max-lines */
import { Knex } from 'knex';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';
import { SyncLogWriter } from './SyncLogWriter.js';
import { Statements, type StatementResult } from './Statement.js';

type AfterSyncLog = (ids: string[], deleted: boolean) => Promise<void>;

type PermissionContext = { bypass: boolean; refIds: string[] };

type TableConfig = {
  tableName: string;
  tenantId: string;
  transactionManager: PostgresTransactionManager;
  accessContext: AccessContext;
  syncWriter?: SyncLogWriter;
  afterSyncLog?: AfterSyncLog;
  identityColumn?: string | null;
};

type ForParams = {
  tableName: string;
  tenantId: string;
  transactionManager: PostgresTransactionManager;
  accessContext: AccessContext;
  syncWriter?: SyncLogWriter;
  afterSyncLog?: AfterSyncLog;
  identityColumn?: string | null;
};

/**
 * What the chain has been asked for so far, carried from one immutable link to the next. It exists
 * so a terminal can tell a projected row read from an aggregate: only the first may take the
 * identity column.
 */
type QueryState = {
  /** Columns passed to `select()`, in order. Raw projections do not count. */
  projected?: string[];
  /** A join, groupBy or distinct is in play, so the identity column must not be added. */
  compound?: boolean;
};

/**
 * Mongo's id type reaching a bind. Postgres keeps ids as TEXT hex, which is exactly what an
 * ObjectId spells, but `pg` serialises an unknown object with `JSON.stringify` — so an ObjectId
 * binds as `'"6aa4…"'`, quotes included, and matches nothing at all. No error, no row: accepting a
 * pdf suggestion silently stopped writing its file selection that way (F50).
 *
 * Checked by `_bsontype` rather than `instanceof`, which fails across two copies of the driver.
 */
const isObjectId = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  (value as { _bsontype?: string })._bsontype === 'ObjectId';

/** An ObjectId binds as its hex string; everything else binds as it is. */
const bindable = (value: unknown): unknown => (isObjectId(value) ? String(value) : value);

const bindableCondition = (condition: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(condition).map(([key, value]) => [key, bindable(value)]));

/**
 * Translates an access context into the RLS session variables
 * (`uwazi.bypass_rls` / `uwazi.ref_ids`) the permission policies read.
 * Privileged actors bypass entirely; anonymous actors get no refIds;
 * collaborators get their user + group refIds.
 */
export const buildPermissionContext = (accessContext: AccessContext): PermissionContext => {
  if (accessContext.isPrivileged()) {
    return { bypass: true, refIds: [] };
  }
  if (accessContext.isAnonymous()) {
    return { bypass: false, refIds: [] };
  }
  return { bypass: false, refIds: accessContext.refIds };
};

/**
 * Immutable, tenant-scoped query builder over a single Postgres table.
 *
 * It only builds SQL: every terminal compiles its query into one Statement and hands it to the
 * transaction manager, which runs it with the tenant and the actor's permission set, so Row-Level
 * Security (see migration 004) applies to it.
 *
 * `tenant_id` is never returned to callers — it is stripped by `cleanRow` on
 * every read (PostgreSQL does not support `SELECT * EXCEPT col` natively).
 */
export class PostgresTable<TRow = Record<string, unknown>> {
  protected readonly cfg: TableConfig;

  private readonly qb: Knex.QueryBuilder;

  protected readonly state: QueryState;

  protected constructor(cfg: TableConfig, qb: Knex.QueryBuilder, state: QueryState = {}) {
    this.cfg = cfg;
    this.qb = qb;
    this.state = state;
  }

  static for<T = Record<string, unknown>>(params: ForParams): PostgresTable<T> {
    return new PostgresTable<T>({ ...params }, Statements.builder(params.tableName));
  }

  get tableName(): string {
    return this.cfg.tableName;
  }

  get tenantId(): string {
    return this.cfg.tenantId;
  }

  get transactionManager(): PostgresTransactionManager {
    return this.cfg.transactionManager;
  }

  query<T = TRow>(): PostgresTable<T> {
    return this.chain(Statements.builder(this.cfg.tableName), {}) as any;
  }

  protected chain(qb: Knex.QueryBuilder, state: QueryState = this.state): this {
    return new (this.constructor as any)(this.cfg, qb, state) as this;
  }

  where(condition: Record<string, unknown>): PostgresTable<TRow> {
    return this.chain(this.qb.clone().where(bindableCondition(condition)));
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

  /**
   * OR-groups a JSONB superset (`@>`) check across multiple candidate values for one column.
   *
   * String values are JSON-encoded first. Knex binds them verbatim, so a bare `'u1'` would
   * reach Postgres as invalid JSON and throw at runtime; `'"u1"'` is the scalar-in-array
   * containment check callers actually want (`'["u1","u2"]'::jsonb @> '"u1"'::jsonb`).
   */
  whereJsonSupersetOfAny(
    column: string,
    values: (Record<string, unknown> | string)[]
  ): PostgresTable<TRow> {
    const encoded = values.map(value =>
      typeof value === 'string' ? JSON.stringify(value) : value
    );

    const qb = this.qb.clone().where(builder => {
      encoded.forEach((value, i) =>
        i === 0
          ? builder.whereJsonSupersetOf(column, value as Record<string, unknown>)
          : builder.orWhereJsonSupersetOf(column, value as Record<string, unknown>)
      );
    });
    return this.chain(qb);
  }

  whereNot(column: string, value: Knex.Value): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereNot(column, bindable(value) as Knex.Value));
  }

  whereNull(column: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereNull(column));
  }

  whereNotNull(column: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereNotNull(column));
  }

  whereIn(column: string, values: Knex.Value[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereIn(column, values.map(bindable) as Knex.Value[]));
  }

  whereNotIn(column: string, values: Knex.Value[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereNotIn(column, values.map(bindable) as Knex.Value[]));
  }

  /** Escape hatch for conditions `where*` can't express, e.g. `"expiresAt" > now()`. */
  whereRaw(sql: string, bindings: readonly Knex.RawBinding[] = []): PostgresTable<TRow> {
    return this.chain(this.qb.clone().whereRaw(sql, bindings));
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): PostgresTable<TRow> {
    return this.chain(this.qb.clone().orderBy(column, direction));
  }

  /** Escape hatch for orderings `orderBy` can't express, e.g. `random()`. */
  orderByRaw(sql: string, bindings: readonly Knex.RawBinding[] = []): PostgresTable<TRow> {
    return this.chain(this.qb.clone().orderByRaw(sql, bindings));
  }

  /** Escape hatch for projections `select` can't express, e.g. `count(*) FILTER (WHERE …)`. */
  selectRaw(sql: string, bindings: readonly Knex.RawBinding[] = []): PostgresTable<TRow> {
    return this.chain(this.qb.clone().select(Statements.fragment(sql, bindings)));
  }

  limit(n: number): PostgresTable<TRow> {
    return this.chain(this.qb.clone().limit(n));
  }

  offset(n: number): PostgresTable<TRow> {
    return this.chain(this.qb.clone().offset(n));
  }

  select(columns: string[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().select(columns), {
      ...this.state,
      projected: [...(this.state.projected ?? []), ...columns],
    });
  }

  join(tableName: string, leftColumn: string, rightColumn: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().join(tableName, leftColumn, '=', rightColumn), {
      ...this.state,
      compound: true,
    });
  }

  leftJoin(tableName: string, leftColumn: string, rightColumn: string): PostgresTable<TRow> {
    return this.chain(this.qb.clone().leftJoin(tableName, leftColumn, '=', rightColumn), {
      ...this.state,
      compound: true,
    });
  }

  groupBy(columns: string[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().groupBy(columns), { ...this.state, compound: true });
  }

  distinct(columns: string[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().distinct(columns), { ...this.state, compound: true });
  }

  returning(columns: string[]): PostgresTable<TRow> {
    return this.chain(this.qb.clone().returning(columns));
  }

  /**
   * Gate check for insert/upsert. Subclasses override to block anonymous users.
   */
  protected applyInsertPolicy(): void {}

  /** The permission context of this table's actor, which every statement it sends runs under. */
  protected get permission(): PermissionContext {
    return buildPermissionContext(this.cfg.accessContext);
  }

  /** Sends a built query as one statement under `permission`. */
  protected async send<T = Record<string, unknown>>(
    qb: Knex.QueryBuilder,
    permission: PermissionContext = this.permission
  ): Promise<StatementResult<T>> {
    return this.cfg.transactionManager.query<T>(Statements.fromBuilder(qb, permission));
  }

  /**
   * Streams query rows through an async iterable backed by a server-side
   * cursor (pg-query-stream). The connection is held open for the duration
   * of iteration and released when the iterable is exhausted or the loop
   * exits (including break / error).
   *
   * Writes issued from within the loop go through the transaction manager again,
   * opening a separate short transaction when no outer `run()` is active.
   */
  async *stream(
    permissionContext: PermissionContext = this.permission
  ): AsyncGenerator<TRow, void, unknown> {
    const statement = Statements.fromBuilder(this.withIdentity(this.qb.clone()), permissionContext);
    for await (const row of this.cfg.transactionManager.stream<Record<string, unknown>>(
      statement
    )) {
      yield this.cleanRow(row) as TRow;
    }
  }

  /**
   * Identity is not projectable: a caller reading rows still has to know which rows it read, and
   * Mongo returns `_id` on any inclusion projection. A projected read therefore takes the table's
   * identity column on top of what it asked for.
   *
   * Three queries cannot: one that joins (a bare column is ambiguous), one that groups or takes
   * distinct rows (the extra column changes the result set), and one over a table that has no
   * identity column, such as `page_locales`. Those are left exactly as the caller built them.
   */
  private withIdentity(qb: Knex.QueryBuilder): Knex.QueryBuilder {
    const identity = this.cfg.identityColumn === undefined ? '_id' : this.cfg.identityColumn;
    const projected = this.state.projected ?? [];

    if (!identity || this.state.compound || !projected.length || projected.includes(identity)) {
      return qb;
    }

    return qb.select(identity);
  }

  async first(): Promise<TRow | undefined> {
    const { rows } = await this.send(this.withIdentity(this.qb.clone()).first());
    return rows[0] ? (this.cleanRow(rows[0]) as TRow) : undefined;
  }

  async all(): Promise<TRow[]> {
    const { rows } = await this.send(this.withIdentity(this.qb.clone()));
    return rows.map(r => this.cleanRow(r)) as TRow[];
  }

  async count(): Promise<number> {
    const { rows } = await this.send<{ count: string | number }>(
      this.qb.clone().count('* as count').first()
    );
    return parseInt(String(rows[0]?.count ?? '0'), 10);
  }

  async sum(column: string): Promise<number> {
    const { rows } = await this.send<{ total?: unknown }>(
      this.qb.clone().sum({ total: column }).first()
    );
    return Number(rows[0]?.total ?? 0);
  }

  async insert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    this.applyInsertPolicy();
    const rows = this.rowsWithTenant(doc);
    if (rows.length === 0) return;
    await this.send(Statements.builder(this.cfg.tableName).insert(rows));
    await this.notifySync(rows, false);
  }

  /**
   * `targetRaw` is the escape hatch for a conflict target `columns` cannot express — a partial
   * index, whose predicate Postgres needs in the target to infer it:
   * `'("tenant_id", "extractorId") WHERE "fileId" IS NULL'`.
   */
  async upsert(
    doc: Record<string, unknown> | Record<string, unknown>[],
    conflict: { columns?: string[]; targetRaw?: string; merge?: string[]; ignore?: boolean } = {}
  ): Promise<void> {
    this.applyInsertPolicy();
    const rows = this.rowsWithTenant(doc);
    if (rows.length === 0) {
      return;
    }

    const inserted = Statements.builder(this.cfg.tableName).insert(rows);
    const qb = conflict.targetRaw
      ? inserted.onConflict(Statements.fragment(conflict.targetRaw))
      : inserted.onConflict(conflict.columns ?? ['_id', 'tenant_id']);
    const conflicting = conflict.ignore ? qb.ignore() : qb.merge(conflict.merge);
    const result = await this.send<{ _id: string }>(conflicting.returning(['_id']));

    await this.notifySync(
      PostgresTable.idsOf(result.rows).map(_id => ({ _id })),
      false
    );
  }

  async update(changes: Record<string, unknown>): Promise<string[]> {
    const serialized = PostgresTable.serialize(changes);
    const result = await this.send<{ _id: string }>(
      this.qb.clone().returning(['_id']).update(serialized)
    );
    const ids = PostgresTable.idsOf(result.rows);
    await this.emitSyncLogs(ids, false);
    return ids;
  }

  async bulkUpdate(rows: Record<string, unknown>[]): Promise<string[]> {
    if (rows.length === 0) return [];

    const hasValue = (row: Record<string, unknown>, column: string) =>
      Object.prototype.hasOwnProperty.call(row, column) && row[column] !== undefined;

    if (!rows.every(row => hasValue(row, '_id'))) {
      throw new Error('bulkUpdate requires every row to carry its "_id"');
    }

    const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row)))).filter(
      column => column !== '_id'
    );

    const castOf = (column: string): string => {
      const value = rows.map(row => row[column]).find(v => v !== null && v !== undefined);
      if (value instanceof Date) return 'timestamptz';
      if (typeof value === 'object') return 'jsonb';
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'number') {
        return Number.isInteger(value) ? 'bigint' : 'double precision';
      }
      return '';
    };

    const serialized = rows.map(row => PostgresTable.serialize(row));
    const valueColumns = ['_id', ...columns];
    const placeholders = serialized
      .map(() => `(${valueColumns.map(() => '?').join(', ')})`)
      .join(', ');
    const bindings = serialized.flatMap(row =>
      valueColumns.map(column => (hasValue(row, column) ? row[column] : null))
    );

    const setClause = columns
      .map(column => {
        const cast = castOf(column);
        const suffix = cast ? `::${cast}` : '';
        const value = serialized.every(row => hasValue(row, column))
          ? `v."${column}"${suffix}`
          : `COALESCE(v."${column}"${suffix}, t."${column}")`;
        return `"${column}" = ${value}`;
      })
      .join(', ');

    const sql = `UPDATE ?? AS t SET ${setClause}
      FROM (VALUES ${placeholders}) AS v(${valueColumns.map(column => `"${column}"`).join(', ')})
      WHERE t."_id" = v."_id" RETURNING t."_id"`;

    const result = await this.raw<{ rows: { _id: string }[] }>(sql, [
      this.cfg.tableName,
      ...bindings,
    ]);

    const affectedIds = result.rows.map(row => row._id);
    await this.emitSyncLogs(affectedIds, false);
    return affectedIds;
  }

  async delete(): Promise<string[]> {
    const result = await this.send<{ _id: string }>(this.qb.clone().returning(['_id']).del());
    const ids = PostgresTable.idsOf(result.rows);
    await this.emitSyncLogs(ids, true);
    return ids;
  }

  /**
   * Escape hatch for SQL the builder cannot express (e.g. atomic JSONB mutations).
   * Runs as one statement under the actor's permission; RLS enforces isolation.
   *
   * Built from the SQL alone — raw SQL must not inherit the builder's accumulated
   * WHERE/filter state from the chain.
   */
  async raw<TResult = StatementResult>(
    sql: string,
    bindings: readonly unknown[] = []
  ): Promise<TResult> {
    const statement = Statements.raw(sql, bindings, this.permission);
    return this.cfg.transactionManager.query(statement) as Promise<TResult>;
  }

  private static serialize(row: Record<string, unknown>): Record<string, unknown> {
    const serialized = { ...row };
    for (const key of Object.keys(serialized)) {
      const value = serialized[key];
      if (isObjectId(value)) {
        serialized[key] = String(value);
      } else if (typeof value === 'object' && value !== null) {
        serialized[key] = JSON.stringify(value);
      }
    }
    return serialized;
  }

  /**
   * Strips infrastructure-only columns (tenant_id, permission arrays) and
   * null values from a row. Subclasses (e.g. the permission-enforced table)
   * override this to apply additional safe-by-default row transforms.
   */
  protected cleanRow(row: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(row).filter(
        ([k, v]) =>
          k !== 'tenant_id' && k !== '_perm_read_refs' && k !== '_perm_write_refs' && v !== null
      )
    );
  }

  async recordSync(ids: string[], deleted = false): Promise<void> {
    await this.emitSyncLogs(ids, deleted);
  }

  protected async notifySync(rows: Record<string, unknown>[], deleted: boolean): Promise<void> {
    const ids = rows.map(row => row._id).filter((id): id is string => typeof id === 'string');
    await this.emitSyncLogs(ids, deleted);
  }

  private async emitSyncLogs(ids: string[], deleted: boolean): Promise<void> {
    if (ids.length === 0 || !this.cfg.syncWriter) return;
    await this.cfg.syncWriter.upsertSyncLogs(ids, deleted);
    await this.cfg.afterSyncLog?.(ids, deleted);
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

export type { AfterSyncLog, TableConfig, QueryState, PermissionContext };
