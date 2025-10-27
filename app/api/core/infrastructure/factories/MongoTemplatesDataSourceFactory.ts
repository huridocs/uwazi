import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource';

export class MongoTemplatesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoTemplatesDataSource(db, transactionManager);
  }
}
