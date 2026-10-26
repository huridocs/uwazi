import knex, { Knex } from 'knex';
import type { PermissionContext } from './PostgresSessionContext.js';

/** The permission a statement runs under; 'inherit' keeps whatever the transaction has set. */
type StatementPermission = PermissionContext | 'inherit';

/** One SQL statement, compiled and ready to send, with knex's `?` placeholders. */
type Statement = {
  sql: string;
  bindings: readonly unknown[];
  permission: StatementPermission;
};

type StatementResult<TRow = Record<string, unknown>> = { rows: TRow[]; rowCount: number };

/** Compiles SQL only: it has no connection, so nothing built from it can run on its own. */
const compiler: Knex = knex({ client: 'pg' });

class Statements {
  static builder(tableName: string): Knex.QueryBuilder {
    return compiler(tableName);
  }

  /** A raw fragment to embed in a builder, e.g. a projection or a conflict target. */
  static fragment(sql: string, bindings: readonly Knex.RawBinding[] = []): Knex.Raw {
    return compiler.raw(sql, bindings);
  }

  static fromBuilder(qb: Knex.QueryBuilder, permission: StatementPermission): Statement {
    const { sql, bindings } = qb.toSQL();
    return { sql, bindings, permission };
  }

  static raw(
    sql: string,
    bindings: readonly unknown[],
    permission: StatementPermission
  ): Statement {
    return { sql, bindings, permission };
  }
}

export { Statements };
export type { Statement, StatementPermission, StatementResult };
