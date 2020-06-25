import { DB } from 'api/odm';
import { tenants } from 'api/tenants/tenantContext';
import { config } from 'api/config';
import errorLog from 'api/log/errorLog';
import { migrator } from './migrator';

const run = async () => {
  await DB.connect();
  const { db } = await DB.connectionForDB(config.defaultTenant.dbName);

  await tenants.run(async () => {
    await migrator.migrate(db);
  });
  //@ts-ignore
  errorLog.closeGraylog();
  await DB.disconnect();
};

run().catch(async e => {
  await DB.disconnect();
  throw e;
});
