import { DB } from 'api/odm';
import { tenants } from 'api/tenants';

export function getConnection() {
  return DB.connectionForDB(tenants.current().dbName).db;
}

export function getClient() {
  return DB.connectionForDB(tenants.current().dbName).getClient();
}
