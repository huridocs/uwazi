// eslint-disable-next-line no-restricted-imports
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { Client } from 'pg';
import { config } from '#api/config.js';
import uniqueID from '#shared/uniqueID.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { PgMigrationLoader } from '#api/core/infrastructure/postgresql/PgMigrationLoader.js';
import { TenantBackupUpgraderFactory } from '#api/core/infrastructure/factories/TenantBackupUpgraderFactory.js';
import { BackupNewerThanSchemaError } from '../../BackupNewerThanSchemaError.js';
import { MalformedManifestError } from '../../MalformedManifestError.js';
import { PrematureEndOfStreamError } from '../../PrematureEndOfStreamError.js';
import { CaptureStream } from '../../specs/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS = {
  '001-create_items.sql': `CREATE TABLE items (
    tenant_id TEXT NOT NULL, _id TEXT NOT NULL, label TEXT, PRIMARY KEY (tenant_id, _id)
  )`,
  '002-add_slug.sql': 'ALTER TABLE items ADD COLUMN slug TEXT',
  '003-fill_slug.ts': `export const migration = {
    scope: 'tenant',
    description: 'fill slug from label',
    reindex: false,
    async up(ctx) {
      await ctx.transaction(async trx =>
        trx('items').whereNull('slug').update({ slug: trx.raw('lower(label)') })
      );
    },
  };`,
};

const backupAt = (schemaVersion: number, columns: string[], rows: string[]) =>
  [
    JSON.stringify({
      version: 1,
      sourceTenant: 'acme',
      schemaVersion,
      tables: [{ name: 'items', columns }],
    }),
    ...rows,
    '\\.',
    '',
  ].join('\n');

const V1_BACKUP = backupAt(
  1,
  ['tenant_id', '_id', 'label'],
  ['acme\ti-2\tBeta', 'acme\ti-1\tAlpha']
);

async function databasesStartingWith(prefix: string): Promise<string[]> {
  const client = new Client({
    host: config.postgres.host,
    port: config.postgres.port,
    database: 'postgres',
    user: config.postgres.admin.user,
    password: config.postgres.admin.password,
  });
  await client.connect();
  try {
    const result = await client.query<{ datname: string }>(
      'SELECT datname FROM pg_database WHERE datname LIKE $1',
      [`${prefix}%`]
    );
    return result.rows.map(row => row.datname);
  } finally {
    await client.end();
  }
}

describe('TenantBackupUpgrader', () => {
  let migrationsDir: string;
  let scratchPrefix: string;

  const writeMigrations = (migrations: Record<string, string>) => {
    Object.entries(migrations).forEach(([file, contents]) =>
      writeFileSync(path.join(migrationsDir, file), contents)
    );
  };

  const upgrader = () =>
    TenantBackupUpgraderFactory.create(createMockLogger(), {
      migrationsDir,
      loadMigration: PgMigrationLoader.byPath,
      scratchPrefix,
    });

  const upgrade = async (text: string, options = {}) => {
    const output = new CaptureStream();
    const result = await upgrader().upgrade(Readable.from([text]), output, options);
    return { result, text: output.text };
  };

  beforeEach(() => {
    migrationsDir = path.join(__dirname, `upgrade-migrations-${uniqueID()}`);
    scratchPrefix = `uwazi_upgrade_spec_${uniqueID()}`.toLowerCase();
    mkdirSync(migrationsDir, { recursive: true });
    writeMigrations(MIGRATIONS);
  });

  afterEach(() => {
    rmSync(migrationsDir, { recursive: true, force: true });
  });

  it('migrates an older backup to the latest version, data migrations included', async () => {
    const { result, text } = await upgrade(V1_BACKUP, { ordered: true });

    expect(result).toEqual({
      sourceTenant: 'acme',
      fromVersion: 1,
      toVersion: 3,
      tables: ['items'],
    });
    expect(text).toBe(
      backupAt(
        3,
        ['tenant_id', '_id', 'label', 'slug'],
        ['acme\ti-1\tAlpha\talpha', 'acme\ti-2\tBeta\tbeta']
      )
    );
  });

  it('writes the backup under another tenant when asked', async () => {
    const { result, text } = await upgrade(V1_BACKUP, { tenantId: 'default' });

    expect(result.sourceTenant).toBe('default');
    expect(JSON.parse(text.split('\n')[0]).sourceTenant).toBe('default');
    expect(text).toContain('default\ti-1\tAlpha\talpha');
    expect(text).not.toContain('acme');
  });

  it('passes a backup already at the latest version through unchanged', async () => {
    const latest = backupAt(3, ['tenant_id', '_id', 'label', 'slug'], ['acme\ti-1\tA\ta']);

    const { result, text } = await upgrade(latest);

    expect(result).toEqual({
      sourceTenant: 'acme',
      fromVersion: 3,
      toVersion: 3,
      tables: ['items'],
    });
    expect(text).toBe(latest);
    expect(await databasesStartingWith(scratchPrefix)).toEqual([]);
  });

  it('refuses a backup newer than the latest migration', async () => {
    const newer = backupAt(4, ['tenant_id', '_id'], []);

    await expect(upgrade(newer)).rejects.toThrow(BackupNewerThanSchemaError);
  });

  it('rejects an empty stream and a malformed manifest', async () => {
    await expect(upgrade('')).rejects.toThrow(PrematureEndOfStreamError);
    await expect(upgrade('not json\n')).rejects.toThrow(MalformedManifestError);
  });

  it('drops the scratch database when a migration fails', async () => {
    writeMigrations({ '004-broken.sql': 'SELECT * FROM missing_table' });

    await expect(upgrade(V1_BACKUP)).rejects.toThrow('missing_table');

    expect(await databasesStartingWith(scratchPrefix)).toEqual([]);
  });

  it('drops the scratch database after a successful upgrade', async () => {
    await upgrade(V1_BACKUP);

    expect(await databasesStartingWith(scratchPrefix)).toEqual([]);
  });
});
