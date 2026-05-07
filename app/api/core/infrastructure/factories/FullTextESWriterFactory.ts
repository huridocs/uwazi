import { TestUtils } from '#api/common.v2/utils/Test.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FullTextESWriter } from '../elasticSearch/entities/FullTextESWriter.js';

export class FullTextESWriterFactory {
  static default(): FullTextESWriter {
    if (!ExecutionContext.tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<FullTextESWriter>({
        deleteByFilenames: async () => Promise.resolve(),
        index: async () => Promise.resolve(),
        tenantId: 'test-tenant',
      });
    }

    const esClient = ExecutionContext.elasticClient;

    const fullTextESWriter = new FullTextESWriter({ esClient });

    return fullTextESWriter;
  }
}
