import { DB } from 'api/odm';
import { tenants } from 'api/tenants';
import { Db, MongoClient } from 'mongodb';

export function getConnection(): Db {
  return DB.connectionForDB(tenants.current().dbName).db;
}

export function getClient(): MongoClient {
  return DB.connectionForDB(tenants.current().dbName).getClient();
}
