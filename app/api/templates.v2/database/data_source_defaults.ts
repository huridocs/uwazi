import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoTemplatesDataSource } from '../../core/infrastructure/mongodb/template/MongoTemplatesDataSource';

const DefaultTemplatesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoTemplatesDataSource(db, transactionManager);
};

export { DefaultTemplatesDataSource };
