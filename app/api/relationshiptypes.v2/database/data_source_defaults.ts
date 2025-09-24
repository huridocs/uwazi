import { getConnection } from '../../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../../common.v2/database/MongoTransactionManager.js';
import { MongoRelationshipTypesDataSource } from './MongoRelationshipTypesDataSource.js';

const DefaultRelationshipTypesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
  return new MongoRelationshipTypesDataSource(db, transactionManager);
};

export { DefaultRelationshipTypesDataSource };
