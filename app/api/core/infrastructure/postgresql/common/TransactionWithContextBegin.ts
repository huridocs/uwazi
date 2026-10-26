import type { Knex } from 'knex';
import Transaction_PG from 'knex/lib/dialects/postgres/execution/pg-transaction.js';

/**
 * What `PostgresTransactionManager` adds to a transaction's config. knex passes the config through
 * to the transaction untouched, except `userParams`, which it overwrites.
 */
type ContextBeginConfig = Knex.TransactionConfig & { sessionContextSql?: string };

/**
 * Sends BEGIN and the session context statement as one message, so opening a transaction costs one
 * round trip instead of two. Without a context it begins exactly as knex does.
 */
class TransactionWithContextBegin extends Transaction_PG {
  sessionContextSql?: string;

  async begin(conn: unknown): Promise<unknown> {
    if (!this.sessionContextSql) return super.begin(conn);

    const mode = [
      this.isolationLevel ? `ISOLATION LEVEL ${this.isolationLevel}` : '',
      this.readOnly ? 'READ ONLY' : '',
    ]
      .join(' ')
      .trim();
    const begin = mode ? `BEGIN TRANSACTION ${mode};` : 'BEGIN;';

    // No bindings, so pg sends it as a simple query, which may hold several statements.
    return this.query(conn, `${begin} ${this.sessionContextSql}`);
  }
}

export { TransactionWithContextBegin };
export type { ContextBeginConfig };
