import { config } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import { ArchivedTenantsQueryService } from './ArchivedTenantsQueryService.js';

/** Archives exist only in the shared Mongo database, whatever TENANTS_BACKEND selects. */
class ArchivedTenantsQueryServiceFactory {
  static default(): ArchivedTenantsQueryService {
    return new ArchivedTenantsQueryService(DB.mongodb_Db(config.SHARED_DB));
  }
}

export { ArchivedTenantsQueryServiceFactory };
