import { config, type TenantsBackend } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import type { TenantsChangeFeed } from '../application/contracts/TenantsChangeFeed.js';
import { MongoTenantsChangeFeed } from './MongoTenantsChangeFeed.js';

class TenantsChangeFeedFactory {
  static default(backend: TenantsBackend = config.tenantsBackend): TenantsChangeFeed {
    if (backend === 'postgres') {
      throw new Error('Postgres tenants change feed not implemented (#9683)');
    }
    return new MongoTenantsChangeFeed(() => DB.mongodb_Db(config.SHARED_DB));
  }
}

export { TenantsChangeFeedFactory };
