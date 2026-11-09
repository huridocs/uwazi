import { existsSync } from 'fs';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { TenantBackupUpgraderFactory } from '#api/core/infrastructure/factories/TenantBackupUpgraderFactory.js';
import { StderrJSONWriter } from '#api/core/libs/logger/infrastructure/writers/StderrJSONWriter.js';
import { BlankStateEmptyError } from '#api/infrastructure/blank_state/BlankStateEmptyError.js';
import { BLANK_STATE_DUMP_FILE } from '#api/infrastructure/blank_state/paths.js';
import type { TenantBackupUpgrader } from '#api/infrastructure/tenant_backup/upgrade/TenantBackupUpgrader.js';
import { BackupFileUpgrade } from '../../controllers/BackupFileUpgrade.js';
import type { BlankStateUpgradeOutput } from '../contracts.js';

/** The tenant the committed dump is written under: the one a single instance runs as. */
const BLANK_STATE_TENANT = 'default';

type UpgradeBlankStateDeps = { dumpFile?: string; upgrader?: TenantBackupUpgrader };

/**
 * Brings the committed blank-state dump to the latest Postgres schema, in place, through a
 * scratch database. What to run when the committed dump's freshness spec fails.
 */
class UpgradeBlankStateController {
  static async handle(deps: UpgradeBlankStateDeps = {}): Promise<BlankStateUpgradeOutput> {
    const dumpFile = deps.dumpFile ?? BLANK_STATE_DUMP_FILE;
    if (!existsSync(dumpFile)) {
      throw new BlankStateEmptyError();
    }
    const upgrader =
      deps.upgrader ??
      TenantBackupUpgraderFactory.create(LoggerFactory.systemLogger(StderrJSONWriter));

    const { fromVersion, toVersion } = await BackupFileUpgrade.run(
      upgrader,
      { input: dumpFile, output: dumpFile },
      { tenantId: BLANK_STATE_TENANT, ordered: true }
    );
    return { fromVersion, toVersion };
  }
}

export { UpgradeBlankStateController };
