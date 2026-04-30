import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { tenants } from '#api/tenants/index.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { EntityESWriter } from '../elasticSearch/entities/EntityESWriter.js';

export class EntityESWriterFactory {
  static default(transactionManager: MongoTransactionManager): EntityESWriter {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<EntityESWriter>({
        deleteBySharedIds: async () => Promise.resolve(),
        deleteByTemplateIds: async () => Promise.resolve(),
        index: async () => Promise.resolve(),
      });
    }

    const esClient = DependenciesContext.elasticClient;
    const entityESWriter = new EntityESWriter({ esClient });

    return entityESWriter;
  }
}
