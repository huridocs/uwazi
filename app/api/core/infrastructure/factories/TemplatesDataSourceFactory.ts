import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.js';

export class TemplatesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoTemplatesDataSource(db, transactionManager);
  }
}
