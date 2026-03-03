import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoRelationshipTypesDataSource } from './MongoRelationshipTypesDataSource.js';

const DefaultRelationshipTypesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoRelationshipTypesDataSource(db, transactionManager);
};

export { DefaultRelationshipTypesDataSource };
