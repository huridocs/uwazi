import { Db, MongoClient } from 'mongodb';

import { DB } from 'api/odm';
import { tenants } from 'api/tenants';
import { Tenant } from 'api/tenants/tenantContext';

function getTenant(): Tenant {
  return tenants.current();
}

function getConnection(): Db {
  return DB.connectionForDB(getTenant().dbName).db;
}

function getClient(): MongoClient {
  return DB.connectionForDB(getTenant().dbName).getClient();
}

export { getTenant, getConnection, getClient };
