import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import { createProgressWriter, isPipe, isTty } from './backupProgress.js';
import { assertPostgresCoreTenant } from './assertPostgresCoreTenant.js';
import type { TenantBackupDeps } from './TenantBackupDeps.js';

/**
 * Streams the current tenant's PostgreSQL data to stdout as a portable COPY stream. Returns
 * nothing on purpose: stdout carries the stream only, so the CLI presenter must stay silent.
 *
 * Progress defaults to on when stderr is a terminal and stdout is not a pipe. A file redirect
 * (`> file`) still reports progress; a pipe into `db import` stays silent, so the two halves
 * of the pipeline don't fight over the terminal with competing cursor-control output.
 */
class ExportTenantController {
  static async handle(deps: TenantBackupDeps = {}): Promise<void> {
    assertPostgresCoreTenant();
    const pool = deps.pool ?? PostgresDB.adminPool();
    const stdout = deps.stdout ?? process.stdout;
    const stderr = deps.stderr ?? process.stderr;
    const tenantId = ExecutionContext.currentTenant.name;
    const progress = createProgressWriter(
      stderr,
      deps.progress ?? (isTty(stderr) && !isPipe(stdout)),
      'exporting'
    );

    try {
      await new PgTenantBackup(pool).export(tenantId, stdout, progress.table);
    } finally {
      progress.close();
    }
  }
}

export { ExportTenantController };
