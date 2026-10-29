import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import type { CleanTenantOutput } from '../contracts.js';
import type { TenantBackupDeps } from './TenantBackupDeps.js';
import { assertPostgresCoreTenant } from './assertPostgresCoreTenant.js';
import { reindexTenant } from './reindexTenant.js';

function resolveDeps(deps: TenantBackupDeps) {
  return {
    pool: deps.pool ?? PostgresDB.adminPool(),
    reindex: deps.reindex ?? reindexTenant,
  };
}

/**
 * Deletes every PostgreSQL row of the current tenant (registry row untouched), then reindexes the
 * now-empty tenant so Elasticsearch drops the stale documents.
 */
class CleanTenantController {
  static async handle(deps: TenantBackupDeps = {}): Promise<CleanTenantOutput> {
    assertPostgresCoreTenant();
    const { pool, reindex } = resolveDeps(deps);
    const tenantId = ExecutionContext.currentTenant.name;

    const result = await new PgTenantBackup(pool).clean(tenantId);
    await reindex(tenantId);

    return result;
  }
}

export { CleanTenantController };
