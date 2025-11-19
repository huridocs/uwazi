import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoCsvImportThesauriValuesDataSource } from './mongodb/MongoCsvImportThesauriValuesDataSource';

const DefaultCsvImportThesauriValuesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoCsvImportThesauriValuesDataSource(db, transactionManager);
};

export { DefaultCsvImportThesauriValuesDataSource };

