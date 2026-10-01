import { config, type TenantsBackend } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import type { TenantsChangeFeed } from '../application/contracts/TenantsChangeFeed.js';
import { MongoTenantsChangeFeed } from './MongoTenantsChangeFeed.js';
import { PostgresTenantsChangeFeed } from './PostgresTenantsChangeFeed.js';

class TenantsChangeFeedFactory {
  static default(backend: TenantsBackend = config.tenantsBackend): TenantsChangeFeed {
    if (backend === 'postgres') {
      return new PostgresTenantsChangeFeed(
        () => PostgresDB.knex,
        config.tenantsPollIntervalSeconds * 1000
      );
    }
    return new MongoTenantsChangeFeed(() => DB.mongodb_Db(config.SHARED_DB));
  }
}

export { TenantsChangeFeedFactory };
