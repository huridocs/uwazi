import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource.js';
import { CachedMongoTemplatesDataSource } from '../mongodb/template/CachedMongoTemplatesDataSource.js';
import { SlotsReconcilerFactory } from './SlotsReconcilerFactory.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { MongoSlotsDAOFactory } from './MongoSlotsDAOFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { SlotsReconciler } from '../elasticSearch/entities/SlotsReconciler.js';

export class TemplatesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsReconciler = SlotsReconcilerFactory.default(transactionManager);
    const esClient = DependenciesContext.elasticClient;
    const slotsDAO = MongoSlotsDAOFactory.default(transactionManager);
    const entityIndexerService = new EntityIndexerService({ esClient, slotsDAO });

    return new MongoTemplatesDataSource({
      db,
      transactionManager,
      slotsReconciler,
      entityIndexerService,
    });
  }

  static cached(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsReconciler = SlotsReconcilerFactory.default(transactionManager);
    const esClient = DependenciesContext.elasticClient;
    const slotsDAO = MongoSlotsDAOFactory.default(transactionManager);
    const entityIndexerService = new EntityIndexerService({ esClient, slotsDAO });

    return new CachedMongoTemplatesDataSource({
      db,
      transactionManager,
      slotsReconciler,
      entityIndexerService,
    });
  }

  static forTesting(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsReconciler = TestUtils.mockClass<SlotsReconciler>({});

    const entityIndexerService = TestUtils.mockClass<EntityIndexerService>({
      index: jest.fn(),
      deleteBySharedIds: jest.fn(),
      deleteByTemplateIds: jest.fn(),
    });

    return new MongoTemplatesDataSource({
      db,
      transactionManager,
      slotsReconciler,
      entityIndexerService,
    });
  }
}
