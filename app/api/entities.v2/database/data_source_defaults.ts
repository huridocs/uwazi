import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';

const DefaultEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoEntitiesDataSource(
    db,
    DefaultRelationshipDataSource(transactionManager),
    new MongoSettingsDataSource(db, transactionManager),
    transactionManager
  );
};

export { DefaultEntitiesDataSource };
