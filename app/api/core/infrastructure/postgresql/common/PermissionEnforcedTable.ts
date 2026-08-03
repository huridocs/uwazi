import type { Knex } from 'knex';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PostgresTable, type TableConfig } from './PostgresTable.js';
import { PostgresTransactionManager } from './PostgresTransactionManager.js';
import { SyncLogWriter } from './SyncLogWriter.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import type { PostgresPermissionTranslator } from './PostgresPermissionTranslator.js';

type ForParams = {
  tableName: string;
  tenantId: string;
  transactionManager: PostgresTransactionManager;
  accessContext: AccessContext;
  translator: PostgresPermissionTranslator;
  knex?: Knex;
  syncWriter?: SyncLogWriter;
};

/**
 * A PostgresTable that enforces entity-level permissions on every operation.
 *
 * Extends PostgresTable and overrides `applyPolicy`, `applyInsertPolicy`,
 * and `chain`. All other chain methods (where, select, join, orWhere, etc.)
 * are inherited and return PermissionEnforcedTable instances thanks to
 * `chain()` propagating `accessContext` and `translator`.
 *
 * Read operations (all, first, count, sum):
 *   The user's query is wrapped as a subquery in FROM. The permission
 *   condition is applied on the outer query. This structurally guarantees
 *   the permission filter wraps any OR conditions — regardless of what
 *   chain methods the user combines.
 *
 * Write operations (update, delete):
 *   The user's WHERE conditions are placed in a subquery (`_id IN (...)`).
 *   The permission condition is ANDed on the outer query. OR precedence
 *   cannot leak.
 *
 * Insert/upsert:
 *   Anonymous users are blocked via `applyInsertPolicy` (no DB roundtrip).
 *   Authenticated users pass through.
 *
 * Raw:
 *   Blocked entirely — cannot be meaningfully filtered.
 */
class PermissionEnforcedTable<TRow = Record<string, unknown>> extends PostgresTable<TRow> {
  private readonly accessContext: AccessContext;

  private readonly translator: PostgresPermissionTranslator;

  protected constructor(
    cfg: TableConfig,
    qb: Knex.QueryBuilder,
    accessContext: AccessContext,
    translator: PostgresPermissionTranslator,
  ) {
    super(cfg, qb);
    this.accessContext = accessContext;
    this.translator = translator;
  }

  static for<TRow = Record<string, unknown>>(params: ForParams): PermissionEnforcedTable<TRow> {
    const knexInstance = params.knex ?? PostgresDB.knex;
    const cfg: TableConfig = {
      knex: knexInstance,
      tableName: params.tableName,
      tenantId: params.tenantId,
      transactionManager: params.transactionManager,
      syncWriter: params.syncWriter,
    };
    return new PermissionEnforcedTable<TRow>(
      cfg,
      knexInstance(params.tableName),
      params.accessContext,
      params.translator,
    );
  }

  protected chain(qb: Knex.QueryBuilder): this {
    return new PermissionEnforcedTable(
      this.cfg,
      qb,
      this.accessContext,
      this.translator,
    ) as any as this;
  }

  /**
   * Override upsert to add write permission condition to ON CONFLICT DO UPDATE.
   *
   * PostgreSQL supports `ON CONFLICT DO UPDATE SET ... WHERE ...`. The WHERE
   * is evaluated at conflict resolution time using the current row state.
   * If the existing row doesn't match the write permission condition, the
   * update is skipped (and the INSERT also fails due to conflict) — the
   * whole operation is a silent no-op.
   *
   * This is atomic — no race condition between check and action.
   */
  async upsert(doc: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    this.applyInsertPolicy();

    const rows = this.rowsWithTenant(doc);
    const result = await this.cfg.transactionManager.withConnection(async trx => {
      const query = trx(this.cfg.tableName)
        .insert(rows)
        .onConflict(['_id', 'tenant_id'])
        .merge()
        .returning(['_id']);
      // applyWriteCondition adds a WHERE to the ON CONFLICT DO UPDATE part.
      // For privileged/system users, the translator returns the qb unchanged.
      this.translator.applyWriteCondition(query, this.accessContext, this.cfg.tableName);
      return query;
    });
    // Only sync rows that were actually inserted or updated.
    // ON CONFLICT DO UPDATE WHERE filters out rows the user can't write to —
    // those are not returned by RETURNING.
    const affectedIds = PostgresTable.idsOf(result);
    if (affectedIds.length > 0) {
      await this.notifySync(
        rows.filter(r => affectedIds.includes(r._id as string)),
        false,
      );
    }
  }

  protected applyPolicy(
    qb: Knex.QueryBuilder,
    operation: 'read' | 'write' | 'raw',
  ): Knex.QueryBuilder {
    if (this.accessContext.isBypassed) return qb;

    switch (operation) {
      case 'read':
        return this.applyReadPolicy(qb);
      case 'write':
        return this.applyWritePolicy(qb);
      case 'raw':
        throw new PermissionDeniedError('raw() is blocked on permission-enforced tables');
      default:
        return qb;
    }
  }

  protected applyInsertPolicy(): void {
    if (this.accessContext.isBypassed) return;
    if (this.accessContext.isAnonymous()) {
      throw new PermissionDeniedError('Anonymous users cannot insert');
    }
  }

  /**
   * Read policy: wrap the user's query as a subquery in FROM, apply the
   * permission condition on the outer query. This preserves SELECT columns,
   * JOINs, ORDER BY, and LIMIT while structurally guaranteeing the
   * permission filter wraps any OR conditions — even if we later add
   * `orWhere` or other OR-capable methods to PostgresTable.
   *
   * GROUP BY, HAVING, LIMIT, OFFSET stay on the outer so permission
   * filtering happens first and permission columns don't affect grouping.
   */
  private applyReadPolicy(qb: Knex.QueryBuilder): Knex.QueryBuilder {
    // Inner: user's WHERE, JOINs.
    const inner = qb.clone().clear('limit').clear('offset').clear('group').clear('having');

    // Add permission columns to inner SELECT so the outer WHERE can reference them.
    // Uses Knex internal _statements to detect explicit select and avoid duplicates.
    // This is fragile but necessary — Knex doesn't expose a public API for this.
    const hasUserSelect = (qb as any)._statements?.some(
      (s: any) => s.grouping === 'columns',
    );
    if (hasUserSelect) {
      for (const col of this.translator.requiredColumns()) {
        const alreadySelected = (qb as any)._statements?.some(
          (s: any) =>
            s.grouping === 'columns' &&
            (s.value === col || (Array.isArray(s.value) && s.value.includes(col))),
        );
        if (!alreadySelected) {
          inner.select(col);
        }
      }
    }

    const innerAlias = inner.as('_inner');
    // Outer: user's select, group, having, order, limit, offset; permission WHERE
    const outer = qb.clone().clear('where');
    outer.from(innerAlias);
    return this.translator.applyReadCondition(outer, this.accessContext);
  }

  /**
   * Write policy: clone the transaction-scoped qb, clear user conditions,
   * add the permission condition ANDed with `_id IN (subquery containing
   * user's original conditions)`. The user's WHERE is only in the subquery,
   * so OR precedence cannot leak.
   */
  private applyWritePolicy(qb: Knex.QueryBuilder): Knex.QueryBuilder {
    const inner = qb.clone().clear('select').select('_id');
    const outer = qb
      .clone()
      .clear('where')
      .clear('select')
      .clear('order')
      .clear('limit');
    this.translator.applyWriteCondition(outer, this.accessContext);
    return outer.whereIn('_id', inner);
  }
}

class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export { PermissionEnforcedTable, PermissionDeniedError };