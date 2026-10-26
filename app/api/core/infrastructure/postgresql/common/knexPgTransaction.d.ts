// knex ships no types for its pg transaction class; TransactionWithContextBegin extends it.
declare module 'knex/lib/dialects/postgres/execution/pg-transaction.js' {
  import type { Knex } from 'knex';

  export default class Transaction_PG {
    constructor(
      ...args: [client: Knex.Client, container: unknown, config?: unknown, outerTx?: unknown]
    );

    isolationLevel?: string;

    readOnly?: boolean;

    begin(conn: unknown): Promise<unknown>;

    query(conn: unknown, sql: string): Promise<unknown>;
  }
}
