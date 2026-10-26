import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgTenantTransfer } from '#api/infrastructure/tenant_transfer/PgTenantTransfer.js';
import type { ImportTenantOutput } from '../contracts.js';
import { reindexTenant } from './reindexTenant.js';
import { createProgressWriter } from './transferProgress.js';
import type { ProgressWriter } from './transferProgress.js';
import type { TenantTransferDeps } from './TenantTransferDeps.js';

type ImportTenantInput = { clear?: boolean };

function resolveDeps(deps: TenantTransferDeps) {
  return {
    pool: deps.pool ?? PostgresDB.adminPool(),
    stdin: deps.stdin ?? process.stdin,
    stderr: deps.stderr ?? process.stderr,
    reindex: deps.reindex ?? reindexTenant,
  };
}

async function cleanBeforeImport(
  transfer: PgTenantTransfer,
  target: { tenantId: string; clear: boolean | undefined; progress: ProgressWriter }
): Promise<void> {
  if (!target.clear) return;
  const label = `cleaning ${target.tenantId}`;
  target.progress.task(label, false);
  await transfer.clean(target.tenantId);
  target.progress.task(label, true);
}

/**
 * Loads a COPY stream from stdin into the current tenant, rewriting every tenant_id to it and
 * clearing sync config, then reindexes it. `clear` wipes the tenant first, so a failed import
 * can be retried in place without running clean separately.
 */
class ImportTenantController {
  static async handle(
    input: ImportTenantInput = {},
    deps: TenantTransferDeps = {}
  ): Promise<ImportTenantOutput> {
    const { pool, stdin, stderr, reindex } = resolveDeps(deps);
    const tenantId = ExecutionContext.currentTenant.name;
    const progress = createProgressWriter(stderr, deps.progress, 'importing');
    const transfer = new PgTenantTransfer(pool);

    await cleanBeforeImport(transfer, { tenantId, clear: input.clear, progress });

    const result = await transfer.import(tenantId, stdin, progress.table);
    progress.line(`reindexing ${tenantId}…`);
    await reindex(tenantId);

    return result;
  }
}

export { ImportTenantController };
export type { ImportTenantInput };
