import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { PgDataMigrationRunner } from '#api/core/infrastructure/postgresql/PgDataMigrationRunner.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { tenants } from '#api/tenants/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PG_MIGRATIONS_DIR = path.join(__dirname, '../postgresql/schema_migrations');

class PgMigratorFactory {
  static create(logger: Logger, pool: pg.Pool = PostgresDB.adminPool()): PgMigrator {
    return new PgMigrator(PG_MIGRATIONS_DIR, pool, {
      logger,
      dataRunner: new PgDataMigrationRunner({
        adminKnex: PostgresDB.adminKnex(),
        appKnex: PostgresDB.appMigrationKnex(),
        listTenants: () => Object.keys(tenants.tenants),
        logger,
      }),
    });
  }
}

export { PgMigratorFactory };
