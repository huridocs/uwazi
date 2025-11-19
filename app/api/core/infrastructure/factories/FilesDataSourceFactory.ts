import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoFilesDataSource } from '../../../files.v2/database/MongoFilesDataSource';
import { FileStorageFactory } from '../../../files.v2/infrastructure/FileStorageFactory';

export class FilesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoFilesDataSource(db, transactionManager, FileStorageFactory.default());
  }
}
