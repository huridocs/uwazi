import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { config } from '#api/config.js';
import { migrator } from './migrator.js';

export const runMigration = async () => {
  await DB.connect(config.DBHOST, config.DBAUTH);
  const { db } = DB.connectionForDB(config.defaultTenant.dbName);
  let migrations: any[] = [];
  await tenants.run(async () => {
    migrations = await migrator.migrate(db);
  });
  await DB.disconnect();

  const reindexNeeded = migrations.some(migration => migration.reindex === true);
  return { reindex: reindexNeeded };
};
