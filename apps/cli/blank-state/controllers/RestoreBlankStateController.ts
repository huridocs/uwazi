import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { BLANK_STATE_DATA_DIR } from '#api/infrastructure/blank_state/paths.js';
import { PgBlankState } from '#api/infrastructure/blank_state/PgBlankState.js';
import type { BlankStateRestoreOutput } from '../contracts.js';
import type { BlankStateDeps } from './BlankStateDeps.js';

type RestoreBlankStateInput = { force?: boolean };

/** Restores blank-state fixtures into the current tenant, replacing data when forced. */
class RestoreBlankStateController {
  static async handle(
    input: RestoreBlankStateInput,
    deps: BlankStateDeps = {}
  ): Promise<BlankStateRestoreOutput> {
    const pool = deps.pool ?? PostgresDB.adminPool();
    const dataDir = deps.dataDir ?? BLANK_STATE_DATA_DIR;
    const tenantId = ExecutionContext.currentTenant.name;

    await new PgBlankState(pool, tenantId, dataDir).run({ force: input.force });

    return { restored: true };
  }
}

export { RestoreBlankStateController };
export type { RestoreBlankStateInput };
