import { TestUtils } from '#api/common.v2/utils/Test.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FullTextIndexerService } from '../elasticSearch/entities/FullTextIndexerService.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { FullTextESWriterFactory } from './FullTextESWriterFactory.js';

export class FullTextIndexerServiceFactory {
  static default(): FullTextIndexerService {
    if (!ExecutionContext.tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<FullTextIndexerService>({
        index: async () => Promise.resolve(),
        syncAll: async () => Promise.resolve(),
        remove: async () => Promise.resolve(),
      });
    }

    const writer = FullTextESWriterFactory.default();
    const filesDAO = new MongoFilesDAO({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
    });

    const fullTextIndexerService = new FullTextIndexerService({ filesDAO, writer });

    return fullTextIndexerService;
  }
}
