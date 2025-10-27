import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoSettingsDataSourceFactory } from 'api/core/infrastructure/factories/MongoSettingsDataSource';
import { MongoTemplatesDataSourceFactory } from 'api/core/infrastructure/factories/MongoTemplatesDataSourceFactory';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';

const DefaultEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoEntitiesDataSource(
    db,
    MongoTemplatesDataSourceFactory.default(transactionManager),
    MongoSettingsDataSourceFactory.default(transactionManager),
    transactionManager
  );
};

export { DefaultEntitiesDataSource };
