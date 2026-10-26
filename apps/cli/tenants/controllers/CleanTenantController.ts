import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import type { CleanTenantOutput } from '../contracts.js';
import type { TenantBackupDeps } from './TenantBackupDeps.js';

/** Deletes every PostgreSQL row of the current tenant, leaving the registry row untouched. */
class CleanTenantController {
  static async handle(deps: TenantBackupDeps = {}): Promise<CleanTenantOutput> {
    const pool = deps.pool ?? PostgresDB.adminPool();
    const tenantId = ExecutionContext.currentTenant.name;

    return new PgTenantBackup(pool).clean(tenantId);
  }
}

export { CleanTenantController };
