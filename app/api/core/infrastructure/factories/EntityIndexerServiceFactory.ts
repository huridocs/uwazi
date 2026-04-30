import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { tenants } from '#api/tenants/index.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { MongoSlotsDAOFactory } from './MongoSlotsDAOFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService.js';

type Overrides = {
  transactionManager?: TransactionManager;
  slotsDAO?: ReturnType<typeof MongoSlotsDAOFactory.default>;
};

export class EntityIndexerServiceFactory {
  static default(overrides?: Overrides): EntityIndexerService {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<EntityIndexerService>({
        deleteBySharedIds: async () => Promise.resolve(),
        deleteByTemplateIds: async () => Promise.resolve(),
        index: async () => Promise.resolve(),
      });
    }

    const esClient = ExecutionContext.elasticClient;
    const slotsDAO =
      overrides?.slotsDAO ??
      MongoSlotsDAOFactory.default({ transactionManager: overrides?.transactionManager });
    const entityIndexerService = new EntityIndexerService({ esClient, slotsDAO });

    return entityIndexerService;
  }
}
