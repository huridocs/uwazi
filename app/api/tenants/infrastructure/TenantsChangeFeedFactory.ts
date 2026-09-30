import { config } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import type { TenantsChangeFeed } from '../application/contracts/TenantsChangeFeed.js';
import { MongoTenantsChangeFeed } from './MongoTenantsChangeFeed.js';

class TenantsChangeFeedFactory {
  static default(): TenantsChangeFeed {
    return new MongoTenantsChangeFeed(() => DB.mongodb_Db(config.SHARED_DB));
  }
}

export { TenantsChangeFeedFactory };
