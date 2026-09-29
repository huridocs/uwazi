import { config } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import type { TenantsDataSource } from '../application/contracts/TenantsDataSource.js';
import { MongoTenantsDataSource } from './MongoTenantsDataSource.js';

/**
 * The registry has no tenant context to resolve from: it is what tells the process which tenants
 * exist. The backend is therefore a process level choice, not a per tenant feature flag — issue
 * #9683 adds the `TENANTS_BACKEND` branch here.
 */
class TenantsDataSourceFactory {
  static default(): TenantsDataSource {
    return new MongoTenantsDataSource(() => DB.mongodb_Db(config.SHARED_DB));
  }
}

export { TenantsDataSourceFactory };
