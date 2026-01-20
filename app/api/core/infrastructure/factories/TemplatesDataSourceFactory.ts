import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource';
import { CachedMongoTemplatesDataSource } from '../mongodb/template/CachedMongoTemplatesDataSource';

export class TemplatesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoTemplatesDataSource(db, transactionManager);
  }

  static cached(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new CachedMongoTemplatesDataSource(db, transactionManager);
  }
}
