import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { EntityIndexerServiceFactory } from './EntityIndexerServiceFactory';

export class EntitiesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    const db = getConnection();

    const entityIndexerService = EntityIndexerServiceFactory.default(transactionManager);

    return new MongoMultiLanguageEntityDataSource({ db, transactionManager, entityIndexerService });
  }

  static forTesting(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    return new MongoMultiLanguageEntityDataSource({
      db: getConnection(),
      transactionManager,
      entityIndexerService: TestUtils.mockClass<EntityIndexerService>({
        index: jest.fn(),
        deleteBySharedIds: jest.fn(),
        deleteByTemplateIds: jest.fn(),
      }),
    });
  }
}
