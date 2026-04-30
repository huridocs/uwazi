import { tenants } from '#api/tenants/index.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FullTextIndexerService } from '../elasticSearch/entities/FullTextIndexerService.js';

export class FullTextIndexerServiceFactory {
  static default(): FullTextIndexerService {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<FullTextIndexerService>({
        deleteByFilenames: async () => Promise.resolve(),
        index: async () => Promise.resolve(),
      });
    }

    const esClient = ExecutionContext.elasticClient;

    const fullTextIndexer = new FullTextIndexerService({ esClient });

    return fullTextIndexer;
  }
}
