import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoFilesDataSource } from '#api/core/infrastructure/mongodb/files/MongoFilesDataSource.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';

export class FilesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoFilesDataSource(db, transactionManager, FileStorageFactory.default());
  }
}
