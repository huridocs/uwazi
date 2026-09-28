import { TenantsDataSourceFactory } from '#api/tenants/infrastructure/TenantsDataSourceFactory.js';
import type { TenantsOutput } from '../contracts.js';

/** Reads straight through the data source: listing adds nothing a use case would own. */
class ListTenantsController {
  static async handle(): Promise<TenantsOutput> {
    return TenantsDataSourceFactory.default().all();
  }
}

export { ListTenantsController };
