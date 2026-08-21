import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { config } from '#api/config.js';
import { migrator } from './migrator.js';

export type MigrationRunResult = {
  migrated: boolean;
  applied: number[];
  reindex: boolean;
};

/**
 * Classic data-migration runner (plain `yarn migrate`).
 *
 * Runs pending Mongo data migrations without consulting the PostgreSQL schema
 * version. Schema-dependency blocking only applies to the `--new` flow
 * (MigrationService/MigrationJob), which advances the PG schema on demand.
 * This runner always treats migrations as runnable, matching the legacy
 * Mongo-only behavior.
 */
export const runMigration = async (): Promise<MigrationRunResult> => {
  await DB.connect(config.DBHOST, config.DBAUTH);

  const { db } = DB.connectionForDB(config.defaultTenant.dbName);
  let migrations: any[] = [];

  await tenants.run(async () => {
    migrations = (await migrator.migrate(db)).migrations;
  });

  await DB.disconnect();

  const reindexNeeded = migrations.some(migration => migration.reindex === true);
  return {
    migrated: migrations.length > 0,
    applied: migrations.map(migration => migration.delta),
    reindex: reindexNeeded,
  };
};
