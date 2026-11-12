import { config, type TenantsBackend } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import type { ArchivedTenantsDataSource } from '../application/contracts/ArchivedTenantsDataSource.js';
import { MongoArchivedTenantsDataSource } from './MongoArchivedTenantsDataSource.js';
import { PostgresArchivedTenantsDataSource } from './PostgresArchivedTenantsDataSource.js';

/**
 * The archived registry follows the tenant registry: both live on the backend selected by
 * `TENANTS_BACKEND`, never split across databases.
 */
class ArchivedTenantsDataSourceFactory {
  static default(backend: TenantsBackend = config.tenantsBackend): ArchivedTenantsDataSource {
    if (backend === 'postgres') {
      return new PostgresArchivedTenantsDataSource(() => PostgresDB.knex);
    }
    return new MongoArchivedTenantsDataSource(() => DB.mongodb_Db(config.SHARED_DB));
  }
}

export { ArchivedTenantsDataSourceFactory };
