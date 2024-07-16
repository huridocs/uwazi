import { ConnectOptions } from 'mongoose';
import { DB } from 'api/odm';
import { tenants } from 'api/tenants/tenantContext';
import { config } from 'api/config';
import { migrator } from './migrator';

let auth: ConnectOptions;

if (process.env.DBUSER) {
  auth = {
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

export const runMigration = async () => {
  await DB.connect(config.DBHOST, auth);
  const { db } = DB.connectionForDB(config.defaultTenant.dbName);
  let migrations: any[] = [];
  await tenants.run(async () => {
    migrations = await migrator.migrate(db);
  });
  await DB.disconnect();

  const reindexNeeded = migrations.some(migration => migration.reindex === true);
  return { reindex: reindexNeeded };
};
