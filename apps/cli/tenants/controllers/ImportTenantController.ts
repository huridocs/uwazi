import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgTenantTransfer } from '#api/infrastructure/tenant_transfer/PgTenantTransfer.js';
import type { ImportTenantOutput } from '../contracts.js';
import { reindexTenant } from './reindexTenant.js';
import { createProgressWriter } from './transferProgress.js';
import type { TenantTransferDeps } from './TenantTransferDeps.js';

/**
 * Loads a COPY stream from stdin into the current tenant, rewriting every tenant_id to it and
 * clearing sync config, then reindexes it. Import assumes the tenant is empty; run clean first to
 * retry a failed import.
 */
class ImportTenantController {
  static async handle(deps: TenantTransferDeps = {}): Promise<ImportTenantOutput> {
    const pool = deps.pool ?? PostgresDB.adminPool();
    const stdin = deps.stdin ?? process.stdin;
    const stderr = deps.stderr ?? process.stderr;
    const reindex = deps.reindex ?? reindexTenant;
    const tenantId = ExecutionContext.currentTenant.name;
    const progress = createProgressWriter(stderr, deps.progress, 'importing');

    const result = await new PgTenantTransfer(pool).import(tenantId, stdin, progress.table);
    progress.line(`reindexing ${tenantId}…`);
    await reindex(tenantId);

    return result;
  }
}

export { ImportTenantController };
