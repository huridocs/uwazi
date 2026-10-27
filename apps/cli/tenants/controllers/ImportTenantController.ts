import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import type { ImportTenantOutput } from '../contracts.js';
import { reindexTenant } from './reindexTenant.js';
import { createProgressWriter } from './backupProgress.js';
import { assertPostgresCoreTenant } from './assertPostgresCoreTenant.js';
import type { ProgressWriter } from './backupProgress.js';
import type { TenantBackupDeps } from './TenantBackupDeps.js';

type ImportTenantInput = { clear?: boolean; nullSync?: boolean };

function resolveDeps(deps: TenantBackupDeps) {
  return {
    pool: deps.pool ?? PostgresDB.adminPool(),
    stdin: deps.stdin ?? process.stdin,
    stderr: deps.stderr ?? process.stderr,
    reindex: deps.reindex ?? reindexTenant,
  };
}

async function cleanBeforeImport(
  backup: PgTenantBackup,
  target: { tenantId: string; clear: boolean | undefined; progress: ProgressWriter }
): Promise<void> {
  if (!target.clear) return;
  const label = `cleaning ${target.tenantId}`;
  target.progress.task(label, false);
  await backup.clean(target.tenantId);
  target.progress.task(label, true);
}

/**
 * Loads a COPY stream from stdin into the current tenant, rewriting every tenant_id to it, then
 * reindexes it. `clear` wipes the tenant first, so a failed import can be retried in place
 * without running clean separately. `nullSync` clears settings.sync (default: preserved).
 */
class ImportTenantController {
  static async handle(
    input: ImportTenantInput = {},
    deps: TenantBackupDeps = {}
  ): Promise<ImportTenantOutput> {
    assertPostgresCoreTenant();
    const { pool, stdin, stderr, reindex } = resolveDeps(deps);
    const tenantId = ExecutionContext.currentTenant.name;
    const progress = createProgressWriter(stderr, deps.progress, 'importing');
    const backup = new PgTenantBackup(pool);

    await cleanBeforeImport(backup, { tenantId, clear: input.clear, progress });

    const result = await backup.import(tenantId, stdin, {
      onProgress: progress.table,
      nullSync: input.nullSync,
    });
    progress.line(`reindexing ${tenantId}…`);
    await reindex(tenantId);

    return result;
  }
}

export { ImportTenantController };
export type { ImportTenantInput };
