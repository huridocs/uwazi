import { ArchivedTenantsQueryServiceFactory } from '../ArchivedTenantsQueryServiceFactory.js';
import type { ArchivesOutput } from '../contracts.js';

/** Reads straight through the query service: listing adds nothing a use case would own. */
class ListArchivesController {
  static async handle(): Promise<ArchivesOutput> {
    return ArchivedTenantsQueryServiceFactory.default().newestFirst();
  }
}

export { ListArchivesController };
