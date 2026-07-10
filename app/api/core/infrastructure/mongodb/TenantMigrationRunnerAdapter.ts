import { tenants } from '#api/tenants/index.js';
import { DB } from '#api/odm/index.js';
import {
  TenantMigrationRunner,
  TenantMigrationResult,
  TenantPendingMigrations,
} from './TenantMigrationRunner.js';
import { Tenant } from '#api/tenants/tenantContext.js';
import { getPendingMigrations, migrateDelta } from '#api/migrations/migrator.js';

export class TenantMigrationRunnerAdapter implements TenantMigrationRunner {
  constructor(
    private migrationsDir: string,
    private loader: (path: string) => Promise<any>
  ) {}

  async getPendingMigrations(
    tenant: Tenant,
    schemaVersion: number
  ): Promise<TenantPendingMigrations> {
    let result: TenantPendingMigrations = { runnable: [], blocked: null };

    await tenants.run(async () => {
      const { runnable, blocked } = await getPendingMigrations(
        this.migrationsDir,
        this.loader,
        schemaVersion
      );
      result = {
        runnable: runnable.map(migration => ({
          delta: migration.delta,
          requiresSchema: migration.requiresSchema,
        })),
        blocked,
      };
    }, tenant.name);

    return result;
  }

  async migrateDelta(
    tenant: Tenant,
    delta: number,
    schemaVersion: number
  ): Promise<TenantMigrationResult> {
    let result: TenantMigrationResult = { status: 'done' };

    await tenants.run(async () => {
      const { db } = DB.connectionForDB(tenant.dbName);
      result = (await migrateDelta(
        this.migrationsDir,
        this.loader,
        db,
        delta,
        schemaVersion
      )) as TenantMigrationResult;
    }, tenant.name);

    return result;
  }
}
