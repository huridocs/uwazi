import { randomUUID } from 'crypto';
import { createReadStream, createWriteStream, existsSync, renameSync, rmSync } from 'fs';
import path from 'path';
import type { Writable } from 'stream';
import { finished } from 'stream/promises';
import type {
  TenantBackupUpgrader,
  UpgradeOptions,
  UpgradeResult,
} from '#api/infrastructure/tenant_backup/upgrade/TenantBackupUpgrader.js';

/**
 * Runs an upgrade from one backup file into another. The result is written next to the output
 * and renamed into place only when complete, so a failure never leaves a partial file behind.
 */
class BackupFileUpgrade {
  static async run(
    upgrader: TenantBackupUpgrader,
    files: { input: string; output: string },
    options: UpgradeOptions = {}
  ): Promise<UpgradeResult> {
    const temporary = BackupFileUpgrade.temporaryPathFor(files.output);
    try {
      const result = await BackupFileUpgrade.writeTo(temporary, async output =>
        upgrader.upgrade(createReadStream(files.input), output, options)
      );
      renameSync(temporary, files.output);
      return result;
    } catch (error) {
      rmSync(temporary, { force: true });
      throw error;
    }
  }

  private static temporaryPathFor(file: string): string {
    return path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  }

  private static async writeTo<T>(
    file: string,
    write: (output: Writable) => Promise<T>
  ): Promise<T> {
    const output = createWriteStream(file);
    try {
      const result = await write(output);
      output.end();
      await finished(output);
      return result;
    } catch (error) {
      output.destroy();
      throw error;
    }
  }

  static exists(file: string): boolean {
    return existsSync(file);
  }
}

export { BackupFileUpgrade };
