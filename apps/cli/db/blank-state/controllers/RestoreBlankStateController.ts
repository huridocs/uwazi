import { createReadStream, existsSync } from 'fs';
import type { Pool } from 'pg';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { BlankStateEmptyError } from '#api/infrastructure/blank_state/BlankStateEmptyError.js';
import { BLANK_STATE_DUMP_FILE } from '#api/infrastructure/blank_state/paths.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import { assertPostgresCoreTenant } from '../../controllers/assertPostgresCoreTenant.js';
import { reindexTenant } from '../../controllers/reindexTenant.js';
import type { BlankStateRestoreOutput } from '../contracts.js';
import type { BlankStateDeps } from './BlankStateDeps.js';

type RestoreBlankStateInput = { force?: boolean };

function resolveDeps(deps: BlankStateDeps) {
  return {
    pool: deps.pool ?? PostgresDB.adminPool(),
    dumpFile: deps.dumpFile ?? BLANK_STATE_DUMP_FILE,
    reindex: deps.reindex ?? reindexTenant,
  };
}

/** Restores the committed blank-state dump into the current tenant, replacing data when forced. */
class RestoreBlankStateController {
  static async handle(
    input: RestoreBlankStateInput = {},
    deps: BlankStateDeps = {}
  ): Promise<BlankStateRestoreOutput> {
    assertPostgresCoreTenant();
    const { pool, dumpFile, reindex } = resolveDeps(deps);
    const tenantId = ExecutionContext.currentTenant.name;
    await RestoreBlankStateController.load(pool, {
      dumpFile,
      tenantId,
      force: input.force,
    });
    await reindex(tenantId);
    return { restored: true };
  }

  private static async load(
    pool: Pool,
    target: { dumpFile: string; tenantId: string; force?: boolean }
  ): Promise<void> {
    if (!existsSync(target.dumpFile)) {
      throw new BlankStateEmptyError();
    }
    const backup = new PgTenantBackup(pool);
    if (target.force) {
      await backup.clean(target.tenantId);
    }
    await backup.import(target.tenantId, createReadStream(target.dumpFile));
  }
}

export { RestoreBlankStateController };
export type { RestoreBlankStateInput };
