import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoRelationshipsDataSource } from './MongoRelationshipsDataSource';
import { MongoV1ConnectionsDataSource } from './MongoV1ConnectionsDataSource';
import { MongoHubsDataSource } from './MongoHubsDataSource';
import { MongoRelationshipMigrationFieldsDataSource } from './MongoRelationshipMigrationFieldsDataSource';
import { MongoMigrationHubRecordDataSource } from './MongoMigrationHubRecordDataSource';

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

const DefaultMigrationHubRecordDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoMigrationHubRecordDataSource(db, transactionManager);
};

export {
  DefaultHubsDataSource,
  DefaultMigrationHubRecordDataSource,
  DefaultRelationshipDataSource,
  DefaultRelationshipMigrationFieldsDataSource,
  DefaultV1ConnectionsDataSource,
};
