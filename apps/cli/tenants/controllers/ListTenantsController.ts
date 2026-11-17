import { TenantsDataSourceFactory } from '#api/tenants/infrastructure/TenantsDataSourceFactory.js';
import { ArchivedTenantsDataSourceFactory } from '#api/tenants/infrastructure/ArchivedTenantsDataSourceFactory.js';
import type { TenantsOutput } from '../contracts.js';

/** Reads straight through the data source: listing adds nothing a use case would own. */
class ListTenantsController {
  static async handle({ archived }: { archived: boolean }): Promise<TenantsOutput> {
    return archived
      ? ArchivedTenantsDataSourceFactory.default().newestFirst()
      : TenantsDataSourceFactory.default().all();
  }
}

export { ListTenantsController };
