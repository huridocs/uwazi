import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { tenants } from '#api/tenants/index.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { MongoSlotsDAOFactory } from './MongoSlotsDAOFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService.js';

export class EntityIndexerServiceFactory {
  static default(transactionManager: MongoTransactionManager): EntityIndexerService {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<EntityIndexerService>({
        deleteBySharedIds: async () => Promise.resolve(),
        deleteByTemplateIds: async () => Promise.resolve(),
        index: async () => Promise.resolve(),
      });
    }

    const esClient = ExecutionContext.elasticClient;
    const slotsDAO = MongoSlotsDAOFactory.default(transactionManager);
    const entityIndexerService = new EntityIndexerService({ esClient, slotsDAO });

    return entityIndexerService;
  }
}
