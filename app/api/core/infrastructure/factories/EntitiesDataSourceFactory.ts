import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { PostgresEntityDataSource } from '#api/entities.v2/database/PostgresEntityDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityIndexerServiceFactory } from './EntityIndexerServiceFactory.js';
import { PostgresConnectionFactory } from './PostgresConnectionFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';

type MongoOverrides = Partial<
  Omit<ConstructorParameters<typeof MongoMultiLanguageEntityDataSource>[0], 'transactionManager'>
> & {
  transactionManager?: TransactionManager;
};

export class EntitiesDataSourceFactory {
  static default(overrides?: MongoOverrides): MultiLanguageEntityDataSource {
    const featureFlags = ExecutionContext.tenant.featureFlags;

    if (featureFlags?.postgresEntities) {
      const db = getConnection();
      const mongoTM = (overrides?.transactionManager ??
        ExecutionContext.transactionManager) as MongoTransactionManager;

      return new PostgresEntityDataSource({
        pool: PostgresConnectionFactory.default(),
        transactionManager: mongoTM,
        templatesDS: TemplatesDataSourceFactory.default(),
        mongoDb: db,
      });
    }

    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;

    const entityIndexerService =
      overrides?.entityIndexerService ?? EntityIndexerServiceFactory.default();

    const { transactionManager: _ignored, ...restOverrides } = overrides ?? {};

    return new MongoMultiLanguageEntityDataSource({
      db,
      transactionManager: mongoTM,
      entityIndexerService,
      ...restOverrides,
    });
  }
}
