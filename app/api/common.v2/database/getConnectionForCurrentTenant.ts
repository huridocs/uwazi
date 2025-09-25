import { Db, MongoClient } from 'mongodb';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { Tenant } from '#api/tenants/tenantContext.js';
import { config } from '../../config.js';

function getTenant(): Tenant {
  return tenants.current();
}

function getConnection(): Db {
  return DB.mongodb_Db(getTenant().dbName);
}

function getSharedConnection(): Db {
  return DB.mongodb_Db(config.SHARED_DB);
}

function getClient(): MongoClient {
  return DB.connectionForDB(getTenant().dbName).getClient();
}

function getSharedClient(): MongoClient {
  return DB.connectionForDB(config.SHARED_DB).getClient();
}

export { getTenant, getConnection, getSharedConnection, getSharedClient, getClient };
