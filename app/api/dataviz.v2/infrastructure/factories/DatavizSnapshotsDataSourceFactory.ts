import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoDatavizSnapshotsDataSource } from '../mongodb/MongoDatavizSnapshotsDataSource.js';

class DatavizSnapshotsDataSourceFactory {
  static default() {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    return new MongoDatavizSnapshotsDataSource(getConnection(), transactionManager);
  }
}

export { DatavizSnapshotsDataSourceFactory };
