import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesDataSource } from '../mongodb/files/MongoFilesDataSource.js';
import { FileStorageFactory } from '../files/FileStorageFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { FullTextIndexerServiceFactory } from './FullTextIndexerServiceFactory.js';

type Overrides = {
  transactionManager?: TransactionManager;
};

export class FilesDataSourceFactory {
  static default(overrides?: Overrides) {
    const db = getConnection();

    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;

    const fullTextIndexer = FullTextIndexerServiceFactory.default();

    return new MongoFilesDataSource(db, mongoTM, FileStorageFactory.default(), {
      fullTextIndexer,
    });
  }
}
