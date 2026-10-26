// knex ships no types for its pg client class; PgClientWithContextBegin extends it.
declare module 'knex/lib/dialects/postgres/index.js' {
  import type { Knex } from 'knex';

  export default class Client_PG extends Knex.Client {}
}
