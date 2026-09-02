import type { Knex } from 'knex';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PostgresTable, type TableConfig } from './PostgresTable.js';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';
import { SyncLogWriter } from './SyncLogWriter.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { filterPermissionsForActor } from '#api/core/infrastructure/common/PermissionDataFilter.js';
import type { PermissionedDocument } from '#api/core/infrastructure/common/PermissionDataFilter.js';

type ForParams = {
  tableName: string;
  tenantId: string;
  transactionManager: PostgresTransactionManager;
  accessContext: AccessContext;
  knex?: Knex;
  syncWriter?: SyncLogWriter;
};

class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * A PostgresTable that enforces entity-level permissions via PostgreSQL's
 * native Row-Level Security (RLS).
 *
 * variables:
 *
 *   - uwazi.bypass_rls : 'true' for admin/editor/system
 *   - uwazi.ref_ids    : comma-separated actor refIds for collaborators
 *
 * The target table must have RLS policies that read these variables and use
 * the overlap operator (&&) on the precomputed _perm_read_refs / _perm_write_refs
 * arrays. This removes the need for application-side subquery wrapping while
 * handling JOINs, CTEs, UNIONs, and subqueries natively in the planner.
 *
 * The anonymous-insert gate is kept here because it gives a clear error message
 * (RLS would silently filter INSERTs instead).
 */
class PostgresPermissionEnforcedTable<TRow = Record<string, unknown>> extends PostgresTable<TRow> {
  private readonly accessContext: AccessContext;

  protected constructor(cfg: TableConfig, qb: Knex.QueryBuilder, accessContext: AccessContext) {
    super(cfg, qb);
    this.accessContext = accessContext;
  }

  static for<TRow = Record<string, unknown>>(
    params: ForParams
  ): PostgresPermissionEnforcedTable<TRow> {
    const knexInstance = params.knex ?? PostgresDB.knex;
    const cfg: TableConfig = {
      knex: knexInstance,
      tableName: params.tableName,
      tenantId: params.tenantId,
      transactionManager: params.transactionManager,
      syncWriter: params.syncWriter,
    };
    return new PostgresPermissionEnforcedTable<TRow>(
      cfg,
      knexInstance(params.tableName),
      params.accessContext
    );
  }

  protected chain(qb: Knex.QueryBuilder): this {
    return new PostgresPermissionEnforcedTable(this.cfg, qb, this.accessContext) as any as this;
  }

  /**
   * Override upsert to keep the anonymous-insert gate and to preserve the
   * original "silent no-op" semantics for unauthorized updates.
   *
   * PostgreSQL's native RLS would raise an error when the conflict update
   * touches a row the actor cannot write to. To keep the API contract
   * (RETURNING only the rows that were actually updated), we bypass RLS for
   * this single statement and add the write-permission condition manually to
   * the ON CONFLICT DO UPDATE WHERE clause — exactly like the pre-RLS version,
   * but using the array overlap operator.
   */
  async upsert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    this.applyInsertPolicy();
    const rows = this.rowsWithTenant(doc);
    const result = await this.cfg.transactionManager.withConnection(
      async trx => {
        const query = trx(this.cfg.tableName)
          .insert(rows)
          .onConflict(['_id', 'tenant_id'])
          .merge()
          .returning(['_id']);
        const writeCondition = this.upsertWriteCondition();
        if (writeCondition) {
          query.whereRaw(writeCondition.sql, writeCondition.bindings);
        }
        return query;
      },
      { bypass: true, refIds: [] }
    );
    const affectedIds = PostgresTable.idsOf(result);
    if (affectedIds.length > 0) {
      await this.notifySync(
        rows.filter(r => affectedIds.includes(r._id as string)),
        false
      );
    }
  }

  private upsertWriteCondition(): { sql: string; bindings: (string | string[])[] } | null {
    if (this.accessContext.isPrivileged()) {
      return null;
    }
    const { refIds } = this.accessContext;
    if (refIds.length === 0) {
      return { sql: 'FALSE', bindings: [] };
    }
    return {
      // Qualify the column with the table name because the ON CONFLICT DO UPDATE
      // scope also exposes the "excluded" pseudo-table, making the bare column
      // reference ambiguous.
      sql: '??.?? && ?',
      bindings: [this.cfg.tableName, '_perm_write_refs', refIds],
    };
  }

  protected applyInsertPolicy(): void {
    if (this.accessContext.isPrivileged()) return;
    if (this.accessContext.isAnonymous()) {
      throw new PermissionDeniedError('Anonymous users cannot insert');
    }
  }

  protected async run<T>(
    fn: (qb: Knex.QueryBuilder) => Promise<T> | Knex.QueryBuilder
  ): Promise<T> {
    return super.run(fn, this.buildPermissionContext());
  }

  stream(): AsyncGenerator<TRow, void, unknown> {
    return super.stream(this.buildPermissionContext());
  }

  /**
   * Runs raw SQL with the actor's permission context applied, so the RLS
   * policies see the correct `uwazi.bypass_rls` / `uwazi.ref_ids` session
   * variables.
   *
   * The base implementation executes the SQL via a `withConnection` call that
   * carries no permission context, which resets those variables to their
   * defaults (bypass=false, refIds=''). On an RLS-enforced table the
   * `permission_write` policy then matches zero rows, silently discarding
   * writes even for privileged actors.
   */
  override async raw<TResult = unknown>(
    sql: string,
    bindings?: unknown
  ): Promise<Knex.Raw<TResult>> {
    return this.cfg.transactionManager.withConnection(
      async trx => trx.raw(sql, bindings as any),
      this.buildPermissionContext()
    ) as Promise<Knex.Raw<TResult>>;
  }

  private buildPermissionContext(): { bypass: boolean; refIds: string[] } {
    if (this.accessContext.isPrivileged()) {
      return { bypass: true, refIds: [] };
    }
    if (this.accessContext.isAnonymous()) {
      return { bypass: false, refIds: [] };
    }
    return { bypass: false, refIds: this.accessContext.refIds };
  }

  /**
   * Safe-by-default row transform: strips the permissions field from rows
   * returned to non-privileged actors unless they hold a write-level grant
   * on the row (RLS already filtered which rows they can see at all).
   */
  protected override cleanRow(row: Record<string, unknown>): Record<string, unknown> {
    return filterPermissionsForActor(
      super.cleanRow(row) as PermissionedDocument,
      this.accessContext
    ) as Record<string, unknown>;
  }
}

export { PostgresPermissionEnforcedTable, PermissionDeniedError };
