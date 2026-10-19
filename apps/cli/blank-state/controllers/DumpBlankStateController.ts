import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { formatBlankStateFixtures } from '#api/infrastructure/blank_state/formatBlankStateFixtures.js';
import { BLANK_STATE_DATA_DIR } from '#api/infrastructure/blank_state/paths.js';
import { PgBlankState } from '#api/infrastructure/blank_state/PgBlankState.js';
import type { BlankStateDumpOutput } from '../contracts.js';
import type { BlankStateDeps } from './BlankStateDeps.js';

/** Dumps the current tenant's blank-state tables into fixture files. */
class DumpBlankStateController {
  static async handle(deps: BlankStateDeps = {}): Promise<BlankStateDumpOutput> {
    const pool = deps.pool ?? PostgresDB.adminPool();
    const dataDir = deps.dataDir ?? BLANK_STATE_DATA_DIR;
    const format = deps.format ?? formatBlankStateFixtures;
    const tenantId = ExecutionContext.currentTenant.name;

    const tables = await new PgBlankState(pool, tenantId, dataDir).dump();
    await format(dataDir, tables);

    return { tables };
  }
}

export { DumpBlankStateController };
