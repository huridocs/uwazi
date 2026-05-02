import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { MongoEntitiesDataSource } from './MongoEntitiesDataSource.js';

const DefaultEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoEntitiesDataSource(
    db,
    TemplatesDataSourceFactory.default({ transactionManager }),
    SettingsDataSourceFactory.default({ transactionManager }),
    transactionManager
  );
};

export { DefaultEntitiesDataSource };
