import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { PgMigratorFactory } from '#api/core/infrastructure/factories/PgMigratorFactory.js';
import { BackupNewerThanSchemaError } from '#api/infrastructure/tenant_backup/BackupNewerThanSchemaError.js';
import { UsageError } from '../../../errors/UsageError.js';
import { UpgradeBackupController } from '../UpgradeBackupController.js';

const latest = PgMigrator.latestVersionIn(PgMigratorFactory.MIGRATIONS_DIR);

const backupAt = (schemaVersion: number) =>
  `${JSON.stringify({
    version: 1,
    sourceTenant: 'acme',
    schemaVersion,
    tables: [{ name: 'templates', columns: ['tenant_id', '_id', 'name'] }],
  })}\nacme\ttpl-1\tDocument\n\\.\n`;

describe('UpgradeBackupController', () => {
  let dir: string;
  let input: string;
  let output: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'uwazi-upgrade-'));
    input = path.join(dir, 'old.uwazidump');
    output = path.join(dir, 'new.uwazidump');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes the upgraded backup to the output file and reports the versions', async () => {
    writeFileSync(input, backupAt(latest));

    const result = await UpgradeBackupController.handle({ input, output });

    expect(result).toEqual({
      sourceTenant: 'acme',
      fromVersion: latest,
      toVersion: latest,
      tables: ['templates'],
    });
    expect(readFileSync(output, 'utf8')).toBe(backupAt(latest));
    expect(readdirSync(dir).sort()).toEqual(['new.uwazidump', 'old.uwazidump']);
  });

  it('refuses to write over the input', async () => {
    writeFileSync(input, backupAt(latest));

    await expect(
      UpgradeBackupController.handle({ input, output: path.join(dir, '.', 'old.uwazidump') })
    ).rejects.toThrow(UsageError);
  });

  it('refuses a missing input file', async () => {
    await expect(UpgradeBackupController.handle({ input, output })).rejects.toThrow(UsageError);
  });

  it('refuses an existing output file unless forced', async () => {
    writeFileSync(input, backupAt(latest));
    writeFileSync(output, 'previous');

    await expect(UpgradeBackupController.handle({ input, output })).rejects.toThrow(UsageError);
    expect(readFileSync(output, 'utf8')).toBe('previous');

    await UpgradeBackupController.handle({ input, output, force: true });
    expect(readFileSync(output, 'utf8')).toBe(backupAt(latest));
  });

  it('leaves no output and no temporary file when the upgrade fails', async () => {
    writeFileSync(input, backupAt(latest + 1));

    await expect(UpgradeBackupController.handle({ input, output })).rejects.toThrow(
      BackupNewerThanSchemaError
    );
    expect(existsSync(output)).toBe(false);
    expect(readdirSync(dir)).toEqual(['old.uwazidump']);
  });
});
