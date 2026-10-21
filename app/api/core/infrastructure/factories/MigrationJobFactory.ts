import { PgMigratorFactory } from '#api/core/infrastructure/factories/PgMigratorFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MigrationJob, MigrationJobDeps } from '#api/core/infrastructure/jobs/MigrationJob.js';
import { tenants } from '#api/tenants/index.js';
import { TenantMigrationRunner } from '#api/core/infrastructure/mongodb/TenantMigrationRunner.js';
import { TenantMigrationRunnerAdapter } from '#api/core/infrastructure/mongodb/TenantMigrationRunnerAdapter.js';
import { migrator } from '#api/migrations/migrator.js';

const createReindexTenant = () => async () => {
  const { reindexAll } = await import('#api/search/entitiesIndex.js');
  const searchIndex = await import('#api/search/index.js');
  const templates = await import('#api/core/v1_layer/templates/index.js');
  const tmpls = await templates.default.get();
  await reindexAll(tmpls, searchIndex.search);
};

class MigrationJobFactory {
  static create(deps: Partial<MigrationJobDeps> = {}): MigrationJob {
    const logger = deps.logger || ExecutionContext.logger;

    const runner: TenantMigrationRunner =
      deps.runner || new TenantMigrationRunnerAdapter(migrator.migrationsDir, migrator.loader);

    return new MigrationJob({
      runner,
      pgMigrator: deps.pgMigrator || PgMigratorFactory.create(logger),
      logger,
      dispatcher: deps.dispatcher || ExecutionContext.jobsDispatcher,
      reindexTenant: deps.reindexTenant || createReindexTenant(),
      tenantsManager: deps.tenantsManager || tenants,
    });
  }
}

export { MigrationJobFactory };
