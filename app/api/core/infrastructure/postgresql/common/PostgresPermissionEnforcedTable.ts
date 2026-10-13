import type { Knex } from 'knex';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import {
  PostgresTable,
  buildPermissionContext,
  type AfterSyncLog,
  type QueryState,
  type TableConfig,
} from './PostgresTable.js';
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
  afterSyncLog?: AfterSyncLog;
  identityColumn?: string | null;
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
  static for<TRow = Record<string, unknown>>(
    params: ForParams
  ): PostgresPermissionEnforcedTable<TRow> {
    const knexInstance = params.knex ?? PostgresDB.knex;
    const cfg: TableConfig = {
      knex: knexInstance,
      tableName: params.tableName,
      tenantId: params.tenantId,
      transactionManager: params.transactionManager,
      accessContext: params.accessContext,
      syncWriter: params.syncWriter,
      afterSyncLog: params.afterSyncLog,
      identityColumn: params.identityColumn,
    };
    return new PostgresPermissionEnforcedTable<TRow>(cfg, knexInstance(params.tableName));
  }

  protected chain(qb: Knex.QueryBuilder, state: QueryState = this.state): this {
    return new PostgresPermissionEnforcedTable(this.cfg, qb, state) as any as this;
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
   *
   * An insert-or-ignore touches no existing row, so it needs no write-permission condition. It
   * still runs with the actor's permission context: ON CONFLICT makes RLS apply the read policy
   * to the inserted rows. Any other conflict target is not supported here.
   */
  async upsert(
    doc: Record<string, unknown> | Record<string, unknown>[],
    conflict: Parameters<PostgresTable['upsert']>[1] = {}
  ): Promise<void> {
    if (conflict.ignore && conflict.columns) {
      return this.insertIgnoringConflicts(doc, conflict.columns);
    }
    if (conflict.ignore || conflict.columns || conflict.targetRaw || conflict.merge) {
      throw new Error(`${this.cfg.tableName}: upsert only supports the default conflict target`);
    }

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

  private async insertIgnoringConflicts(
    doc: Record<string, unknown> | Record<string, unknown>[],
    conflictColumns: string[]
  ): Promise<void> {
    this.applyInsertPolicy();
    const rows = this.rowsWithTenant(doc);
    if (rows.length === 0) return;

    const result = await this.cfg.transactionManager.withConnection(
      async trx =>
        trx(this.cfg.tableName)
          .insert(rows)
          .onConflict(conflictColumns)
          .ignore()
          .returning(['_id']),
      buildPermissionContext(this.cfg.accessContext)
    );
    await this.notifySync(
      PostgresTable.idsOf(result).map(_id => ({ _id })),
      false
    );
  }

  private upsertWriteCondition(): { sql: string; bindings: (string | string[])[] } | null {
    if (this.cfg.accessContext.isPrivileged()) {
      return null;
    }
    const { refIds } = this.cfg.accessContext;
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
    if (this.cfg.accessContext.isPrivileged()) return;
    if (this.cfg.accessContext.isAnonymous()) {
      throw new PermissionDeniedError('Anonymous users cannot insert');
    }
  }

  /**
   * Safe-by-default row transform: strips the permissions field from rows
   * returned to non-privileged actors unless they hold a write-level grant
   * on the row (RLS already filtered which rows they can see at all).
   */
  protected override cleanRow(row: Record<string, unknown>): Record<string, unknown> {
    return filterPermissionsForActor(
      super.cleanRow(row) as PermissionedDocument,
      this.cfg.accessContext
    ) as Record<string, unknown>;
  }
}

export { PostgresPermissionEnforcedTable, PermissionDeniedError };
