import { Db, MongoClient } from 'mongodb';

import { DB } from 'api/odm';
import { tenants } from 'api/tenants';

import { Tenant } from '../model/Tenant';

function getTenant(): Tenant {
  const currentTenant = tenants.current();
  return new Tenant(currentTenant.name, currentTenant.dbName, currentTenant.indexName);
}

function getConnection(): Db {
  return DB.connectionForDB(getTenant().dbName).db;
}

function getClient(): MongoClient {
  return DB.connectionForDB(getTenant().dbName).getClient();
}

export { getTenant, getConnection, getClient };