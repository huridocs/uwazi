import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoDeprecatedEntitiesDataSource } from './MongoDeprecatedEntitiesDataSource.js';

const DefaultDeprecatedEntitiesDataSource = (transactionManager: TransactionManager) => {
  const db = getConnection();
  const { accessContext } = ExecutionContext;
  return new MongoDeprecatedEntitiesDataSource(
    db,
    TemplatesDataSourceFactory.default({ transactionManager }),
    SettingsDataSourceFactory.default({ transactionManager }),
    transactionManager,
    accessContext
  );
};

export { DefaultDeprecatedEntitiesDataSource };
