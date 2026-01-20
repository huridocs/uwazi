import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoRelationshipsDataSource } from '#api/relationships.v2/database/MongoRelationshipsDataSource.js';
import { MongoV1ConnectionsDataSource } from '#api/relationships.v2/database/MongoV1ConnectionsDataSource.js';
import { MongoHubsDataSource } from '#api/relationships.v2/database/MongoHubsDataSource.js';
import { MongoRelationshipMigrationFieldsDataSource } from '#api/relationships.v2/database/MongoRelationshipMigrationFieldsDataSource.js';
import { MongoMigrationHubRecordDataSource } from '#api/relationships.v2/database/MongoMigrationHubRecordDataSource.js';

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
