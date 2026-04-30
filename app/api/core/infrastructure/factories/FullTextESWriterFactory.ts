import { tenants } from '#api/tenants/index.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { FullTextESWriter } from '../elasticSearch/entities/FullTextESWriter.js';

export class FullTextESWriterFactory {
  static default(): FullTextESWriter {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<FullTextESWriter>({
        deleteByFilenames: async () => Promise.resolve(),
        index: async () => Promise.resolve(),
      });
    }

    const esClient = DependenciesContext.elasticClient;

    const fullTextESWriter = new FullTextESWriter({ esClient });

    return fullTextESWriter;
  }
}
