import type { Knex } from 'knex';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';

/**
 * Converts an AccessContext into Postgres-specific WHERE conditions.
 *
 * The translator receives the Knex query builder and mutates it to add
 * permission conditions. This allows complex conditions (JSONB containment,
 * OR groups, raw SQL) that a plain Record<string, unknown> cannot express.
 *
 * Each backend (Mongo, Postgres) will have its own translator implementation.
 */
export interface PostgresPermissionTranslator {
  /** Add read conditions to the query builder (all, first, count, sum). */
  applyReadCondition(qb: Knex.QueryBuilder, ac: AccessContext): Knex.QueryBuilder;

  /** Add write conditions to the query builder (update, delete).
   *  When tableName is provided, qualify columns to avoid ambiguity in ON CONFLICT WHERE. */
  applyWriteCondition(qb: Knex.QueryBuilder, ac: AccessContext, tableName?: string): Knex.QueryBuilder;

  /** Columns that must be present in the inner query for permission checking. */
  requiredColumns(): string[];
}

/**
 * Default implementation: checks `published` and `permissions` JSONB columns.
 *
 * - Admin / editor: no restriction (privileged).
 * - Anonymous: published rows only.
 * - Collaborator: published rows OR rows where `permissions` JSONB array
 *   contains an entry with matching refId. For write, the entry must
 *   also have `level: 'write'`.
 */
export class PostgresEntityPermissionTranslator implements PostgresPermissionTranslator {
  requiredColumns(): string[] {
    return ['published', 'permissions'];
  }

  applyReadCondition(qb: Knex.QueryBuilder, ac: AccessContext): Knex.QueryBuilder {
    if (ac.isPrivileged()) return qb;
    if (ac.isAnonymous()) return qb.where({ published: true });

    return qb.where(function (this: Knex.QueryBuilder) {
      this.where({ published: true });
      for (const refId of ac.refIds) {
        this.orWhereRaw('permissions @> ?::jsonb', [JSON.stringify([{ refId }])]);
      }
    });
  }

  applyWriteCondition(
    qb: Knex.QueryBuilder,
    ac: AccessContext,
    tableName?: string,
  ): Knex.QueryBuilder {
    if (ac.isPrivileged()) return qb;
    if (ac.isAnonymous()) return qb.where({ _id: null });

    const refIds = ac.refIds;
    if (refIds.length === 0) return qb.where({ _id: null });

    const col = tableName ? `${tableName}.permissions` : 'permissions';
    const sql = refIds.map(() => `${col} @> ?::jsonb`).join(' OR ');
    const bindings = refIds.map(id => JSON.stringify([{ refId: id, level: 'write' }]));
    return qb.whereRaw(`(${sql})`, bindings);
  }
}
