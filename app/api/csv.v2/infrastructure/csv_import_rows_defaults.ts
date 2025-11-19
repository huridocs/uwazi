import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoCsvImportRowsDataSource } from './mongodb/MongoCsvImportRowsDataSource';

const DefaultCsvImportRowsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoCsvImportRowsDataSource(db, transactionManager);
};

export { DefaultCsvImportRowsDataSource };
