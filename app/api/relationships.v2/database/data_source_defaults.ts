import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoRelationshipsDataSource } from './MongoRelationshipsDataSource';

const DefaultRelationshipsDataSource = (transactionManager: MongoTransactionManager) => {
  const connection = getConnection();
  return new MongoRelationshipsDataSource(connection, transactionManager);
};

export { DefaultRelationshipsDataSource as DefaultRelationshipDataSource };
