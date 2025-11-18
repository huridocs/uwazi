import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { FileStorageFactory } from '../infrastructure/FileStorageFactory';
import { MongoFilesDataSource } from './MongoFilesDataSource';

export class FilesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoFilesDataSource(db, transactionManager, FileStorageFactory.default());
  }
}
