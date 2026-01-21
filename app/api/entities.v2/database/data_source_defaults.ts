import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoEntitiesDataSource } from '#api/entities.v2/database/MongoEntitiesDataSource.js';
import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';

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
