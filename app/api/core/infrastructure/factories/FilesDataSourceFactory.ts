import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoFilesDataSource } from '../mongodb/files/MongoFilesDataSource';
import { FileStorageFactory } from '../files/FileStorageFactory';

export class FilesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoFilesDataSource(db, transactionManager, FileStorageFactory.default());
  }
}
