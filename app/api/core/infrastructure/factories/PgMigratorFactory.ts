import path from 'path';
import { fileURLToPath } from 'url';
import type { Knex } from 'knex';
import pg from 'pg';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { PgDataMigrationRunner } from '#api/core/infrastructure/postgresql/PgDataMigrationRunner.js';
import {
  PgMigrationLoader,
  type LoadPgMigration,
} from '#api/core/infrastructure/postgresql/PgMigrationLoader.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { tenants } from '#api/tenants/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** The connections a migrator runs through: schema and global work as the migrator, tenant work as app. */
type PgMigratorConnections = {
  pool: pg.Pool;
  adminKnex: Knex;
  appKnex: Knex;
  listTenants: () => string[];
};

/** Specs point a migrator at a fixture directory, loaded the way Jest can import. */
type PgMigratorSource = { migrationsDir?: string; loadMigration?: LoadPgMigration };

class PgMigratorFactory {
  static readonly MIGRATIONS_DIR = path.join(__dirname, '../postgresql/schema_migrations');

  static create(logger: Logger, pool: pg.Pool = PostgresDB.adminPool()): PgMigrator {
    return PgMigratorFactory.forConnections(logger, {
      pool,
      adminKnex: PostgresDB.adminKnex(),
      appKnex: PostgresDB.appMigrationKnex(),
      listTenants: () => Object.keys(tenants.tenants),
    });
  }

  /** A migrator over the given connections, e.g. a scratch database holding one tenant. */
  static forConnections(
    logger: Logger,
    connections: PgMigratorConnections,
    source: PgMigratorSource = {}
  ): PgMigrator {
    const migrationsDir = source.migrationsDir ?? PgMigratorFactory.MIGRATIONS_DIR;
    return new PgMigrator(migrationsDir, connections.pool, {
      logger,
      loadMigration: source.loadMigration ?? PgMigrationLoader.fromDisk,
      dataRunner: new PgDataMigrationRunner({
        adminKnex: connections.adminKnex,
        appKnex: connections.appKnex,
        listTenants: connections.listTenants,
        logger,
      }),
    });
  }
}

export { PgMigratorFactory };
export type { PgMigratorConnections, PgMigratorSource };
