import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { MongoSlotsDAOFactory } from './MongoSlotsDAOFactory';

export class EntitiesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    const db = getConnection();

    const esClient = DependenciesContext.elasticClient;
    const slotsDAO = MongoSlotsDAOFactory.default(transactionManager);

    const entityIndexerService = new EntityIndexerService({
      esClient,
      slotsDAO,
    });

    return new MongoMultiLanguageEntityDataSource({ db, transactionManager, entityIndexerService });
  }

  static forTesting(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    return new MongoMultiLanguageEntityDataSource({
      db: getConnection(),
      transactionManager,
      entityIndexerService: TestUtils.mockClass<EntityIndexerService>({ index: jest.fn() }),
    });
  }
}
