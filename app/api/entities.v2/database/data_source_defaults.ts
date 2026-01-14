import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource';

const DefaultEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoEntitiesDataSource(
    db,
    TemplatesDataSourceFactory.default(transactionManager),
    SettingsDataSourceFactory.default(transactionManager),
    transactionManager
  );
};

export { DefaultEntitiesDataSource };
