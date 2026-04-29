import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { EntityIndexerServiceFactory } from './EntityIndexerServiceFactory.js';

export class EntitiesDataSourceFactory {
  static default(transactionManager: TransactionManager): MultiLanguageEntityDataSource {
    const db = getConnection();
    const mongoTM = transactionManager as MongoTransactionManager;

    const entityIndexerService = EntityIndexerServiceFactory.default(mongoTM);

    return new MongoMultiLanguageEntityDataSource({
      db,
      transactionManager: mongoTM,
      entityIndexerService,
    });
  }

  static forTesting(transactionManager: TransactionManager): MultiLanguageEntityDataSource {
    const mongoTM = transactionManager as MongoTransactionManager;
    return new MongoMultiLanguageEntityDataSource({
      db: getConnection(),
      transactionManager: mongoTM,
      entityIndexerService: TestUtils.mockClass<EntityIndexerService>({
        index: jest.fn(),
        deleteBySharedIds: jest.fn(),
        deleteByTemplateIds: jest.fn(),
      }),
    });
  }
}
