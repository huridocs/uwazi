import { Db, MongoClient } from 'mongodb';

import { DB } from 'api/odm';
import { tenants } from 'api/tenants';

import { Tenant } from '../model/Tenant';

export function getTenant(): Tenant {
  const currentTenant = tenants.current();
  return new Tenant(currentTenant.name, currentTenant.dbName, currentTenant.indexName);
}

export function getConnection(): Db {
  return DB.connectionForDB(getTenant().dbName).db;
}

export function getClient(): MongoClient {
  return DB.connectionForDB(getTenant().dbName).getClient();
}
