import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { MongoDeprecatedEntitiesDataSource } from './MongoDeprecatedEntitiesDataSource.js';

const DefaultDeprecatedEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoDeprecatedEntitiesDataSource(
    db,
    TemplatesDataSourceFactory.default({ transactionManager }),
    SettingsDataSourceFactory.default({ transactionManager }),
    transactionManager
  );
};

export { DefaultDeprecatedEntitiesDataSource };
