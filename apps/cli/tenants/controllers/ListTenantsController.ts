import { TenantsDataSourceFactory } from '#api/tenants/infrastructure/TenantsDataSourceFactory.js';
import type { TenantsOutput } from '../contracts.js';
import { ArchivedTenantsQueryServiceFactory } from '../archived/ArchivedTenantsQueryServiceFactory.js';

/** Reads straight through the data source: listing adds nothing a use case would own. */
class ListTenantsController {
  static async handle({ archived }: { archived: boolean }): Promise<TenantsOutput> {
    return archived
      ? ArchivedTenantsQueryServiceFactory.default().newestFirst()
      : TenantsDataSourceFactory.default().all();
  }
}

export { ListTenantsController };
