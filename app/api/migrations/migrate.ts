import { ConnectionOptions } from 'mongoose';
import { DB } from 'api/odm';
import { tenants } from 'api/tenants/tenantContext';
import { config } from 'api/config';
import { errorLog } from 'api/log';
import { migrator } from './migrator';

process.on('unhandledRejection', error => {
  throw error;
});

let auth: ConnectionOptions;

if (process.env.DBUSER) {
  auth = {
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

export const run = async () => {
  await DB.connect(config.DBHOST, auth);
  const { db } = DB.connectionForDB(config.defaultTenant.dbName);
  let migrations: any[] = [];
  await tenants.run(async () => {
    migrations = await migrator.migrate(db);
  });
  //@ts-ignore
  errorLog.closeGraylog();
  await DB.disconnect();

  const reindexNeeded = migrations.some(migration => migration.reindex === true);
  process.stdout.write(JSON.stringify({ reindex: reindexNeeded }));
};

run().catch(async e => {
  await DB.disconnect();
  throw e;
});
