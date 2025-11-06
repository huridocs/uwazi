import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoCsvImportsDataSource } from './MongoCsvImportsDataSource';

const DefaultCsvImportsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoCsvImportsDataSource(db, transactionManager);
};

export { DefaultCsvImportsDataSource };
