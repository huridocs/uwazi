import { getConnection } from '../../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../../common.v2/database/MongoTransactionManager.js';
import { MongoRelationshipTypesDataSource } from './MongoRelationshipTypesDataSource.js';

const DefaultRelationshipTypesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoRelationshipTypesDataSource(db, transactionManager);
};

export { DefaultRelationshipTypesDataSource };
