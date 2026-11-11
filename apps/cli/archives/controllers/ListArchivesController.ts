import { ArchivedTenantsDataSourceFactory } from '#api/tenants/infrastructure/ArchivedTenantsDataSourceFactory.js';
import type { ArchivesOutput } from '../contracts.js';

/**
 * Deprecated alias of `tenants list --archived`, kept until the manager switches over.
 * Reads straight through the data source: listing adds nothing a use case would own.
 */
class ListArchivesController {
  static async handle(): Promise<ArchivesOutput> {
    return ArchivedTenantsDataSourceFactory.default().newestFirst();
  }
}

export { ListArchivesController };
