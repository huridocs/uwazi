import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoFilesDataSource } from './MongoFilesDataSource';
import { FileStorageStrategyFactory } from '../infrastructure/FileStorageStrategyFactory';

const DefaultFilesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoFilesDataSource(
    db,
    transactionManager,
    FileStorageStrategyFactory.createDefault()
  );
};

export { DefaultFilesDataSource };
