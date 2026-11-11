import { ArchivedTenantsQueryServiceFactory } from '../../tenants/archived/ArchivedTenantsQueryServiceFactory.js';
import type { ArchivesOutput } from '../contracts.js';

/**
 * Deprecated alias of `tenants list --archived`, kept until the manager switches over.
 * Reads straight through the query service: listing adds nothing a use case would own.
 */
class ListArchivesController {
  static async handle(): Promise<ArchivesOutput> {
    return ArchivedTenantsQueryServiceFactory.default().newestFirst();
  }
}

export { ListArchivesController };
