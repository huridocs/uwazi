import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoDatavizDataSource } from '../mongodb/MongoDatavizDataSource.js';

class DatavizDataSourceFactory {
  static default() {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    return new MongoDatavizDataSource(getConnection(), transactionManager);
  }
}

export { DatavizDataSourceFactory };
