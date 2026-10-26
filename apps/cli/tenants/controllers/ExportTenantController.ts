import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgTenantTransfer } from '#api/infrastructure/tenant_transfer/PgTenantTransfer.js';
import { createProgressWriter } from './transferProgress.js';
import type { TenantTransferDeps } from './TenantTransferDeps.js';

/**
 * Streams the current tenant's PostgreSQL data to stdout as a portable COPY stream. Returns
 * nothing on purpose: stdout carries the stream only, so the CLI presenter must stay silent.
 */
class ExportTenantController {
  static async handle(deps: TenantTransferDeps = {}): Promise<void> {
    const pool = deps.pool ?? PostgresDB.adminPool();
    const stdout = deps.stdout ?? process.stdout;
    const stderr = deps.stderr ?? process.stderr;
    const tenantId = ExecutionContext.currentTenant.name;
    const progress = createProgressWriter(stderr, deps.progress, 'exporting');

    await new PgTenantTransfer(pool).export(tenantId, stdout, progress.table);
  }
}

export { ExportTenantController };
