import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoRelationshipsDataSource } from './MongoRelationshipsDataSource';
import { MongoV1ConnectionsDataSource } from './MongoV1ConnectionsDataSource';
import { MongoHubsDataSource } from './MongoHubsDataSource';
import { MongoRelationshipMigrationFieldsDataSource } from './RelationshipMigrationFieldsDataSource';

const DefaultRelationshipDataSource = (transactionManager: MongoTransactionManager) => {
  const connection = getConnection();
  return new MongoRelationshipsDataSource(connection, transactionManager);
};

const DefaultV1ConnectionsDataSource = (transactionManager: MongoTransactionManager) => {
  const connection = getConnection();
  return new MongoV1ConnectionsDataSource(connection, transactionManager);
};

const DefaultHubsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoHubsDataSource(db, transactionManager);
};

const DefaultRelationshipMigrationFieldsDataSource = (
  transactionManager: MongoTransactionManager
) => {
  const db = getConnection();
  return new MongoRelationshipMigrationFieldsDataSource(db, transactionManager);
};

export {
  DefaultHubsDataSource,
  DefaultRelationshipDataSource,
  DefaultRelationshipMigrationFieldsDataSource,
  DefaultV1ConnectionsDataSource,
};
