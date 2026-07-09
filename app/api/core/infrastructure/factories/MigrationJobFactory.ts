import path from 'path';
import { fileURLToPath } from 'url';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MigrationJob, MigrationJobDeps } from '#api/core/infrastructure/jobs/MigrationJob.js';
import { TenantMigrationRunner } from '#api/core/infrastructure/mongodb/TenantMigrationRunner.js';
import { TenantMigrationRunnerAdapter } from '#api/core/infrastructure/mongodb/TenantMigrationRunnerAdapter.js';
import { migrator } from '#api/migrations/migrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PG_MIGRATIONS_DIR = path.join(__dirname, '../postgresql/schema_migrations');

const createReindexTenant = () => async () => {
  const { reindexAll } = await import('#api/search/entitiesIndex.js');
  const searchIndex = await import('#api/search/index.js');
  const templates = await import('#api/core/v1_layer/templates/index.js');
  const tmpls = await templates.default.get();
  await reindexAll(tmpls, searchIndex.search);
};

class MigrationJobFactory {
  static create(deps: Partial<MigrationJobDeps> = {}): MigrationJob {
    const pgPool = PostgresDB.pool();
    const pgMigrator = new PgMigrator(PG_MIGRATIONS_DIR, pgPool);

    const runner: TenantMigrationRunner =
      deps.runner || new TenantMigrationRunnerAdapter(migrator.migrationsDir, migrator.loader);

    return new MigrationJob({
      runner,
      pgMigrator: deps.pgMigrator || pgMigrator,
      logger: deps.logger || ExecutionContext.logger,
      dispatcher: deps.dispatcher || ExecutionContext.jobsDispatcher,
      reindexTenant: deps.reindexTenant || createReindexTenant(),
    });
  }
}

export { MigrationJobFactory };
