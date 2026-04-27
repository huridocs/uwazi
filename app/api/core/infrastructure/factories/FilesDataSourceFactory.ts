import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesDataSource } from '../mongodb/files/MongoFilesDataSource.js';
import { FileStorageFactory } from '../files/FileStorageFactory.js';
import { FullTextIndexerServiceFactory } from './FullTextIndexerServiceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

export class FilesDataSourceFactory {
  static default() {
    const { transactionManager } = ExecutionContext;
    const db = getConnection();

    const fullTextIndexer = FullTextIndexerServiceFactory.default();

    return new MongoFilesDataSource(db, transactionManager, FileStorageFactory.default(), {
      fullTextIndexer,
    });
  }
}
