import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TenantBackupUpgrader } from '#api/infrastructure/tenant_backup/upgrade/TenantBackupUpgrader.js';
import { PgMigratorFactory, type PgMigratorSource } from './PgMigratorFactory.js';
import { ScratchDatabaseFactory } from './ScratchDatabaseFactory.js';

type TenantBackupUpgraderOptions = PgMigratorSource & { scratchPrefix?: string };

class TenantBackupUpgraderFactory {
  static create(logger: Logger, options: TenantBackupUpgraderOptions = {}): TenantBackupUpgrader {
    const migrationsDir = options.migrationsDir ?? PgMigratorFactory.MIGRATIONS_DIR;
    return new TenantBackupUpgrader({
      latestVersion: () => PgMigrator.latestVersionIn(migrationsDir),
      createScratch: async () => ScratchDatabaseFactory.create({ prefix: options.scratchPrefix }),
      migratorFor: (connections, tenantId) =>
        PgMigratorFactory.forConnections(
          logger,
          {
            pool: connections.pool,
            adminKnex: connections.migratorKnex,
            appKnex: connections.appKnex,
            listTenants: () => [tenantId],
          },
          { migrationsDir, loadMigration: options.loadMigration }
        ),
    });
  }
}

export { TenantBackupUpgraderFactory };
