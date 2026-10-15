import { Knex } from 'knex';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

/**
 * What the runner hands a Postgres data migration. The connection is the table owner's, so RLS
 * does not apply, and no transaction is open: the migration decides how to cut up its work.
 */
type PgDataMigrationContext = {
  knex: Knex;
  logger: Logger;
  /** Call during long work, or the job running the migration is taken for dead. */
  heartbeat: () => Promise<void>;
  /** Tenants whose indexed data changed. Only allowed when the migration declares `reindex`. */
  reindex: (tenantIds: string[]) => void;
};

/** The default export of a `.ts` file in `schema_migrations`. */
type PgDataMigration = {
  description: string;
  reindex: boolean;
  up(ctx: PgDataMigrationContext): Promise<void>;
};

export type { PgDataMigration, PgDataMigrationContext };
