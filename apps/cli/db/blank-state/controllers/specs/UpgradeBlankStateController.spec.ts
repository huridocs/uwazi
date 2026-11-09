import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { PgMigratorFactory } from '#api/core/infrastructure/factories/PgMigratorFactory.js';
import { PgMigrationLoader } from '#api/core/infrastructure/postgresql/PgMigrationLoader.js';
import { TenantBackupUpgraderFactory } from '#api/core/infrastructure/factories/TenantBackupUpgraderFactory.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { BlankStateEmptyError } from '#api/infrastructure/blank_state/BlankStateEmptyError.js';
import { UpgradeBlankStateController } from '../UpgradeBlankStateController.js';

const latest = PgMigrator.latestVersionIn(PgMigratorFactory.MIGRATIONS_DIR);

const dumpFrom = (sourceTenant: string, schemaVersion: number) =>
  `${JSON.stringify({
    version: 1,
    sourceTenant,
    schemaVersion,
    tables: [{ name: 'relationship_types', columns: ['tenant_id', '_id', 'name'] }],
  })}\n${sourceTenant}\trt-2\tB\n${sourceTenant}\trt-1\tA\n\\.\n`;

/** Jest cannot import the file URLs the production loader uses; everything else is production. */
const upgrader = () =>
  TenantBackupUpgraderFactory.create(createMockLogger(), {
    loadMigration: PgMigrationLoader.byPath,
  });

describe('UpgradeBlankStateController', () => {
  let dir: string;
  let dumpFile: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'uwazi-blank-state-'));
    dumpFile = path.join(dir, 'blank_state.uwazidump');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('leaves a dump of the default tenant at the latest version as it is', async () => {
    writeFileSync(dumpFile, dumpFrom('default', latest));

    const result = await UpgradeBlankStateController.handle({ dumpFile, upgrader: upgrader() });

    expect(result).toEqual({ fromVersion: latest, toVersion: latest });
    expect(readFileSync(dumpFile, 'utf8')).toBe(dumpFrom('default', latest));
    expect(readdirSync(dir)).toEqual(['blank_state.uwazidump']);
  });

  it('rewrites the dump in place under the default tenant, ordered by primary key', async () => {
    writeFileSync(dumpFile, dumpFrom('golden', latest));

    const result = await UpgradeBlankStateController.handle({ dumpFile, upgrader: upgrader() });

    expect(result).toEqual({ fromVersion: latest, toVersion: latest });
    const [manifestLine, ...lines] = readFileSync(dumpFile, 'utf8').split('\n');
    expect(JSON.parse(manifestLine)).toMatchObject({
      sourceTenant: 'default',
      schemaVersion: latest,
    });
    expect(lines.filter(line => line.includes('\trt-'))).toEqual([
      'default\trt-1\tA',
      'default\trt-2\tB',
    ]);
    expect(readdirSync(dir)).toEqual(['blank_state.uwazidump']);
  });

  it('fails when there is no dump file', async () => {
    await expect(
      UpgradeBlankStateController.handle({ dumpFile, upgrader: upgrader() })
    ).rejects.toThrow(BlankStateEmptyError);
  });
});
