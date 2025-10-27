import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTemplatesDataSourceFactory } from 'api/core/infrastructure/factories/MongoTemplatesDataSourceFactory';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';

const DefaultEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoEntitiesDataSource(
    db,
    MongoTemplatesDataSourceFactory.default(transactionManager),
    DefaultSettingsDataSource(transactionManager),
    transactionManager
  );
};

export { DefaultEntitiesDataSource };
