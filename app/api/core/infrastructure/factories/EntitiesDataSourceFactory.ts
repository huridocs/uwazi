import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { CachedMongoEntitiesDataSource } from 'api/entities.v2/database/CachedMongoEntitiesDataSource';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';

export class EntitiesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    const db = getConnection();
    return new MongoMultiLanguageEntityDataSource(db, transactionManager);
  }

  static cached(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    const db = getConnection();
    return new CachedMongoEntitiesDataSource(db, transactionManager);
  }
}
