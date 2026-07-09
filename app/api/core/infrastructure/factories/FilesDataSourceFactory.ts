import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesDataSource } from '../mongodb/files/MongoFilesDataSource.js';
import { PostgresFilesDataSource } from '../postgresql/files/PostgresFilesDataSource.js';
import { FileStorageFactory } from '../files/FileStorageFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';

type Overrides = {
  transactionManager?: TransactionManager;
};

export class FilesDataSourceFactory {
  static default(overrides?: Overrides) {
    const db = getConnection();
    const { tenant } = ExecutionContext;

    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;

    if (tenant.featureFlags?.postgresFiles) {
      return new PostgresFilesDataSource({
        mongoDb: db,
        tenantId: tenant.name,
        transactionManager: tm,
        fileStorage: FileStorageFactory.default(),
      });
    }

    return new MongoFilesDataSource(db, tm, FileStorageFactory.default());
  }
}
