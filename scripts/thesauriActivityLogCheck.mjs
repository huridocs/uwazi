/* eslint-disable no-await-in-loop */
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import mongodb from 'mongodb';

const TENANT_DB_NAME = process.env.TENANT_DB_NAME || 'uwazi_shared_db';

const LOG_FILE_PATH = process.env.ACTIVITY_LOG_OUTPUT_PATH || './thesauriActivityLogCheck.log';

const cutoffDateString = '2024-04-02T09:20:00Z';
const cutoffDate = new Date(cutoffDateString);
const cutOffDateTimeStamp = cutoffDate.valueOf();

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://127.0.0.1/';
  const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
  await client.connect();

  return client;
};

const openFile = async () => {
  const logStream = fs.createWriteStream(LOG_FILE_PATH, { flags: 'w' });
  return logStream;
};

const readTenants = async client => {
  const tenantDb = client.db(TENANT_DB_NAME);
  const tenantCollection = tenantDb.collection('tenants');
  const tenants = await tenantCollection.find({}).toArray();
  return tenants;
};

const handleTenant = async (tenant, logStream, client) => {
  const { name, dbName } = tenant;

  const tenantDB = client.db(dbName);
  const activityLogCollection = tenantDB.collection('activitylogs');
  const activityLogCursor = activityLogCollection.find({
    method: 'POST',
    url: '/api/thesauris',
    time: { $gt: cutOffDateTimeStamp },
  });

  const activityLogCount = await activityLogCursor.count();

  const logObject = {
    name,
    dbName,
    activityLogCount,
  };
  logStream.write(`${JSON.stringify(logObject, null, 2)}\n`);
};

const handleTenants = async (tenants, logStream, client) => {
  for (let i = 0; i < tenants.length; i += 1) {
    const tenant = tenants[i];
    await handleTenant(tenant, logStream, client);
  }
};

const main = async () => {
  const client = await getClient();
  const logStream = await openFile();

  const tenants = await readTenants(client);
  await handleTenants(tenants, logStream, client);

  await client.close();
  logStream.end();
};

main();
