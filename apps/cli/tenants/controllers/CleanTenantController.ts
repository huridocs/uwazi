import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgTenantTransfer } from '#api/infrastructure/tenant_transfer/PgTenantTransfer.js';
import type { CleanTenantOutput } from '../contracts.js';
import type { TenantTransferDeps } from './TenantTransferDeps.js';

/** Deletes every PostgreSQL row of the current tenant, leaving the registry row untouched. */
class CleanTenantController {
  static async handle(deps: TenantTransferDeps = {}): Promise<CleanTenantOutput> {
    const pool = deps.pool ?? PostgresDB.adminPool();
    const tenantId = ExecutionContext.currentTenant.name;

    return new PgTenantTransfer(pool).clean(tenantId);
  }
}

export { CleanTenantController };
