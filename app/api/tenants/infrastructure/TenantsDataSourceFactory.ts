import { config, type TenantsBackend } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import type { TenantsDataSource } from '../application/contracts/TenantsDataSource.js';
import { MongoTenantsDataSource } from './MongoTenantsDataSource.js';
import { PostgresTenantsDataSource } from './PostgresTenantsDataSource.js';

/**
 * The registry has no tenant context to resolve from: it is what tells the process which tenants
 * exist. The backend is therefore a process level choice, not a per tenant feature flag: the
 * `TENANTS_BACKEND` environment variable.
 */
class TenantsDataSourceFactory {
  static default(backend: TenantsBackend = config.tenantsBackend): TenantsDataSource {
    if (backend === 'postgres') {
      return new PostgresTenantsDataSource(() => PostgresDB.knex);
    }
    return new MongoTenantsDataSource(() => DB.mongodb_Db(config.SHARED_DB));
  }
}

export { TenantsDataSourceFactory };
