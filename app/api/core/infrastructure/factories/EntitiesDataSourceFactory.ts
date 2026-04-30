import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { tenants } from '#api/tenants/index.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { User } from '#api/users.v2/model/User.js';
import { EntityESWriter } from '../elasticSearch/entities/EntityESWriter.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService.js';
import { MongoSlotsDAOFactory } from './MongoSlotsDAOFactory.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';

export class EntitiesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    const db = getConnection();
    const tenant = tenants.current();

    let entityIndexerService: EntityIndexerService;

    if (!tenant.featureFlags?.v2ElasticSearch || process.env.NODE_ENV === 'test') {
      entityIndexerService = TestUtils.mockClass<EntityIndexerService>({
        index: async () => Promise.resolve(),
        remove: async () => Promise.resolve(),
        removeByTemplateIds: async () => Promise.resolve(),
      });
    } else {
      const esClient = DependenciesContext.elasticClient;
      const entityWriter = new EntityESWriter({ esClient });
      const slotsDAO = MongoSlotsDAOFactory.default(transactionManager);
      const entityDAO = new MongoEntityDAO(db, transactionManager, User.createFrom(null));
      entityIndexerService = new EntityIndexerService({
        writer: entityWriter,
        entityDAO,
        slotsDAO,
      });
    }

    return new MongoMultiLanguageEntityDataSource({ db, transactionManager, entityIndexerService });
  }

  static forTesting(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    return new MongoMultiLanguageEntityDataSource({
      db: getConnection(),
      transactionManager,
      entityIndexerService: TestUtils.mockClass<EntityIndexerService>({
        index: jest.fn(),
        remove: jest.fn(),
        removeByTemplateIds: jest.fn(),
      }),
    });
  }
}
