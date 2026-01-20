import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';
import { MongoEntitiesDataSource } from '#api/entities.v2/database/MongoEntitiesDataSource.js';

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
