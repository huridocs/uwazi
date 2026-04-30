import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoFilesDataSource } from '../mongodb/files/MongoFilesDataSource.js';
import { FileStorageFactory } from '../files/FileStorageFactory.js';
import { FullTextESWriterFactory } from './FullTextESWriterFactory.js';
import { FullTextIndexerService } from '../elasticSearch/entities/FullTextIndexerService.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';

export class FilesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const fullTextIndexer = new FullTextIndexerService({
      writer: FullTextESWriterFactory.default(),
      filesDAO: new MongoFilesDAO({ db, transactionManager }),
    });

    return new MongoFilesDataSource(db, transactionManager, FileStorageFactory.default(), {
      fullTextIndexer,
    });
  }
}
