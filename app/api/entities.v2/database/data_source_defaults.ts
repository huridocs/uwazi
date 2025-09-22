import { getConnection } from '../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../common.v2/database/MongoTransactionManager.js';
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
import { DefaultTemplatesDataSource } from '../templates.v2/database/data_source_defaults.js';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';

const DefaultEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoEntitiesDataSource(
    db,
    DefaultTemplatesDataSource(transactionManager),
    DefaultSettingsDataSource(transactionManager),
    transactionManager
  );
};

export { DefaultEntitiesDataSource };
