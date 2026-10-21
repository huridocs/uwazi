import { Knex } from 'knex';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

/**
 * What the runner hands a `global` Postgres data migration. The connection is the table owner's,
 * so RLS does not apply, and no transaction is open: the migration decides how to cut up its work.
 */
type PgGlobalMigrationContext = {
  knex: Knex;
  logger: Logger;
  /** Call during long work, or the job running the migration is taken for dead. */
  heartbeat: () => Promise<void>;
  /** Tenants whose indexed data changed. Only allowed when the migration declares `reindex`. */
  reindex: (tenantIds: string[]) => void;
};

/**
 * What the runner hands a `tenant` Postgres data migration, once per tenant. The database is
 * reached only through `transaction`, which scopes every statement to `tenantId` by RLS.
 */
type PgTenantMigrationContext = {
  tenantId: string;
  /** Opens a transaction scoped to `tenantId`. Split large work across several calls. */
  transaction: <T>(fn: (trx: Knex.Transaction) => Promise<T>) => Promise<T>;
  logger: Logger;
  /** Call during long work, or the job running the migration is taken for dead. */
  heartbeat: () => Promise<void>;
  /** This tenant's indexed data changed. Only allowed when the migration declares `reindex`. */
  reindex: () => void;
};

type PgGlobalDataMigration = {
  scope: 'global';
  description: string;
  reindex: boolean;
  up(ctx: PgGlobalMigrationContext): Promise<void>;
};

type PgTenantDataMigration = {
  scope: 'tenant';
  description: string;
  reindex: boolean;
  up(ctx: PgTenantMigrationContext): Promise<void>;
};

/** What a `.ts` file in `schema_migrations` exports, as `migration`. */
type PgDataMigration = PgGlobalDataMigration | PgTenantDataMigration;

export type {
  PgDataMigration,
  PgGlobalDataMigration,
  PgGlobalMigrationContext,
  PgTenantDataMigration,
  PgTenantMigrationContext,
};
