import type { Knex } from 'knex';
import Client_PG from 'knex/lib/dialects/postgres/index.js';
import {
  TransactionWithContextBegin,
  type ContextBeginConfig,
} from './TransactionWithContextBegin.js';

/** knex's pg client, with transactions that send BEGIN and the session context together. */
class PgClientWithContextBegin extends Client_PG {
  transaction(container: unknown, config: unknown, outerTx: unknown): Knex.Transaction {
    const trx = new TransactionWithContextBegin(this, container, config, outerTx);
    // begin() runs once the connection is acquired, after this returns.
    trx.sessionContextSql = (config as ContextBeginConfig | undefined)?.sessionContextSql;
    return trx as unknown as Knex.Transaction;
  }
}

export { PgClientWithContextBegin };
