import path from 'path';
import { fileURLToPath } from 'url';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { config } from '#api/config.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { migrator } from './migrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PG_MIGRATIONS_DIR = path.join(
  __dirname,
  '../core/infrastructure/postgresql/schema_migrations'
);

export type MigrationRunResult =
  | {
      migrated: boolean;
      applied: number[];
      reindex: boolean;
      schemaVersion: number;
    }
  | {
      blocked: { delta: number; requiresSchema: number };
      currentSchema: number;
    };

export const runMigration = async (): Promise<MigrationRunResult> => {
  await DB.connect(config.DBHOST, config.DBAUTH);
  PostgresDB.connect();
  const pgPool = PostgresDB.pool();

  const pgMigrator = new PgMigrator(PG_MIGRATIONS_DIR, pgPool);
  const currentSchemaVersion = await pgMigrator.getCurrentVersion();

  const { db } = DB.connectionForDB(config.defaultTenant.dbName);
  let migrationsResult: {
    migrations: any[];
    blocked: { delta: number; requiresSchema: number } | null;
  } = { migrations: [], blocked: null };
  await tenants.run(async () => {
    migrationsResult = await migrator.migrate(db, currentSchemaVersion);
  });

  await DB.disconnect();
  await PostgresDB.disconnect();

  if (migrationsResult.blocked) {
    return {
      blocked: migrationsResult.blocked,
      currentSchema: currentSchemaVersion,
    };
  }

  const reindexNeeded = migrationsResult.migrations.some(migration => migration.reindex === true);
  return {
    migrated: migrationsResult.migrations.length > 0,
    applied: migrationsResult.migrations.map(migration => migration.delta),
    reindex: reindexNeeded,
    schemaVersion: currentSchemaVersion,
  };
};
