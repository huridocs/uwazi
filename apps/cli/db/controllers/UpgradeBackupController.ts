import path from 'path';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { StderrJSONWriter } from '#api/core/libs/logger/infrastructure/writers/StderrJSONWriter.js';
import { TenantBackupUpgraderFactory } from '#api/core/infrastructure/factories/TenantBackupUpgraderFactory.js';
import type { TenantBackupUpgrader } from '#api/infrastructure/tenant_backup/upgrade/TenantBackupUpgrader.js';
import { UsageError } from '../../errors/UsageError.js';
import type { UpgradeBackupOutput } from '../contracts.js';
import { BackupFileUpgrade } from './BackupFileUpgrade.js';

type UpgradeBackupInput = { input: string; output: string; force?: boolean };

type UpgradeBackupDeps = { upgrader?: TenantBackupUpgrader };

/**
 * Migrates a backup file to the latest Postgres schema through a scratch database, writing the
 * result to another file. The live database is never touched.
 */
class UpgradeBackupController {
  static async handle(
    request: UpgradeBackupInput,
    deps: UpgradeBackupDeps = {}
  ): Promise<UpgradeBackupOutput> {
    const files = UpgradeBackupController.checkedFiles(request);
    const upgrader =
      deps.upgrader ??
      TenantBackupUpgraderFactory.create(
        // No tenant is selected: the backup's tenant only exists inside the scratch database.
        LoggerFactory.systemLogger(StderrJSONWriter)
      );
    return BackupFileUpgrade.run(upgrader, files);
  }

  private static checkedFiles(request: UpgradeBackupInput): { input: string; output: string } {
    const input = path.resolve(request.input);
    const output = path.resolve(request.output);
    if (input === output) {
      throw new UsageError('--output must be a different file from --input');
    }
    if (!BackupFileUpgrade.exists(input)) {
      throw new UsageError(`--input does not exist: ${request.input}`);
    }
    if (BackupFileUpgrade.exists(output) && !request.force) {
      throw new UsageError(
        `--output already exists: ${request.output} (use --force to replace it)`
      );
    }
    return { input, output };
  }
}

export { UpgradeBackupController };
export type { UpgradeBackupInput };
