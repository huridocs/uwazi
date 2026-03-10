import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoRelationshipTypesDataSource } from './MongoRelationshipTypesDataSource';

const DefaultRelationshipTypesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoRelationshipTypesDataSource(db, transactionManager);
};

export { DefaultRelationshipTypesDataSource };
