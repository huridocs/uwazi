import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoDeprecatedEntitiesDataSource } from './MongoDeprecatedEntitiesDataSource.js';

const DefaultDeprecatedEntitiesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  const user = ExecutionContext.actor ?? User.createFrom(null);
  const accessContext = AccessContext.forActor(user);
  return new MongoDeprecatedEntitiesDataSource(
    db,
    TemplatesDataSourceFactory.default({ transactionManager }),
    SettingsDataSourceFactory.default({ transactionManager }),
    transactionManager,
    accessContext
  );
};

export { DefaultDeprecatedEntitiesDataSource };
