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
interface PostgresPermissionTranslator {
  /** Add read conditions to the query builder (all, first, count, sum). */
  applyReadCondition(qb: Knex.QueryBuilder, ac: AccessContext): Knex.QueryBuilder;

  /** Add write conditions to the query builder (update, delete).
   *  When tableName is provided, qualify columns to avoid ambiguity in ON CONFLICT WHERE. */
  applyWriteCondition(qb: Knex.QueryBuilder, ac: AccessContext, tableName?: string): Knex.QueryBuilder;

  /** Columns that must be present in the inner query for permission checking. */
  requiredColumns(): string[];
}

export type { PostgresPermissionTranslator };
