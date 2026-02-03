import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoRelationshipsDataSource } from './MongoRelationshipsDataSource.js';
import { MongoV1ConnectionsDataSource } from './MongoV1ConnectionsDataSource.js';
import { MongoHubsDataSource } from './MongoHubsDataSource.js';
import { MongoRelationshipMigrationFieldsDataSource } from './MongoRelationshipMigrationFieldsDataSource.js';
import { MongoMigrationHubRecordDataSource } from './MongoMigrationHubRecordDataSource.js';

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
