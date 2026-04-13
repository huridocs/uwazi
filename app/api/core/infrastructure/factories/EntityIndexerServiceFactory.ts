import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { tenants } from '#api/tenants/index.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { MongoSlotsDAOFactory } from './MongoSlotsDAOFactory';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService';

export class EntityIndexerServiceFactory {
  static default(transactionManager: MongoTransactionManager): EntityIndexerService {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      return TestUtils.mockClass<EntityIndexerService>({
        deleteBySharedIds: jest.fn(),
        deleteByTemplateIds: jest.fn(),
        index: jest.fn(),
      });
    }

    const esClient = DependenciesContext.elasticClient;
    const slotsDAO = MongoSlotsDAOFactory.default(transactionManager);
    const entityIndexerService = new EntityIndexerService({ esClient, slotsDAO });

    return entityIndexerService;
  }
}
