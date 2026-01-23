import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoRelationshipTypesDataSource } from '#api/relationshiptypes.v2/database/MongoRelationshipTypesDataSource.js';

const DefaultRelationshipTypesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoRelationshipTypesDataSource(db, transactionManager);
};

export { DefaultRelationshipTypesDataSource };
