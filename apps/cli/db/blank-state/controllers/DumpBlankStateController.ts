import { createWriteStream } from 'fs';
import { finished } from 'stream/promises';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { BLANK_STATE_DUMP_FILE } from '#api/infrastructure/blank_state/paths.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import { assertPostgresCoreTenant } from '../../controllers/assertPostgresCoreTenant.js';
import type { BlankStateDumpOutput } from '../contracts.js';
import type { BlankStateDeps } from './BlankStateDeps.js';

/** Dumps the current tenant's PostgreSQL data to the committed blank-state dump file. */
class DumpBlankStateController {
  static async handle(deps: BlankStateDeps = {}): Promise<BlankStateDumpOutput> {
    assertPostgresCoreTenant();
    const pool = deps.pool ?? PostgresDB.adminPool();
    const dumpFile = deps.dumpFile ?? BLANK_STATE_DUMP_FILE;
    const tables = await DumpBlankStateController.exportToFile(
      new PgTenantBackup(pool),
      ExecutionContext.currentTenant.name,
      dumpFile
    );
    return { tables };
  }

  private static async exportToFile(
    backup: PgTenantBackup,
    tenantId: string,
    dumpFile: string
  ): Promise<string[]> {
    const output = createWriteStream(dumpFile);
    try {
      const tables = await backup.export(tenantId, output);
      output.end();
      await finished(output);
      return tables;
    } catch (error) {
      output.destroy();
      throw error;
    }
  }
}

export { DumpBlankStateController };
