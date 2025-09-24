// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
import { MongoRelationshipsDataSource } from './MongoRelationshipsDataSource';
import { MongoV1ConnectionsDataSource } from './MongoV1ConnectionsDataSource';
import { MongoHubsDataSource } from './MongoHubsDataSource';
import { MongoRelationshipMigrationFieldsDataSource } from './MongoRelationshipMigrationFieldsDataSource';
import { MongoMigrationHubRecordDataSource } from './MongoMigrationHubRecordDataSource';

const DefaultRelationshipDataSource = (transactionManager: MongoTransactionManager) => {
  const connection = getConnection();
  // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
  return new MongoRelationshipsDataSource(connection, transactionManager);
};

const DefaultV1ConnectionsDataSource = (transactionManager: MongoTransactionManager) => {
  const connection = getConnection();
  // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
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
  // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
  return new MongoRelationshipMigrationFieldsDataSource(db, transactionManager);
};

const DefaultMigrationHubRecordDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
  return new MongoMigrationHubRecordDataSource(db, transactionManager);
};

export {
  DefaultHubsDataSource,
  DefaultMigrationHubRecordDataSource,
  DefaultRelationshipDataSource,
  DefaultRelationshipMigrationFieldsDataSource,
  DefaultV1ConnectionsDataSource,
};
