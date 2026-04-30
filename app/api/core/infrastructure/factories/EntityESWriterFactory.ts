import { TestUtils } from '#api/common.v2/utils/Test.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityESWriter, EntityESWriterDeps } from '../elasticSearch/entities/EntityESWriter.js';

export class EntityESWriterFactory {
  static default(overrides?: EntityESWriterDeps): EntityESWriter {
    if (!ExecutionContext.tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<EntityESWriter>({
        deleteBySharedIds: async () => Promise.resolve(),
        deleteByTemplateIds: async () => Promise.resolve(),
        index: async () => Promise.resolve(),
      });
    }

    const esClient = ExecutionContext.elasticClient;

    const entityESWriter = new EntityESWriter({ esClient, ...overrides });

    return entityESWriter;
  }
}
