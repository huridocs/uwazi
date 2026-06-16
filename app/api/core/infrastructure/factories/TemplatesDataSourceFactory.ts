import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { PostgresTemplatesDataSource } from '#api/core/infrastructure/postgresql/template/PostgresTemplatesDataSource.js';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource.js';
import { CachedMongoTemplatesDataSource } from '../mongodb/template/CachedMongoTemplatesDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = Partial<
  Omit<ConstructorParameters<typeof MongoTemplatesDataSource>[0], 'transactionManager'>
> & {
  transactionManager?: TransactionManager;
};

export class TemplatesDataSourceFactory {
  static default(overrides?: Overrides) {
    const tenant = ExecutionContext.currentTenant;
    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    const { transactionManager: _ignored, ...restOverrides } = overrides ?? {};

    if (tenant.featureFlags?.postgresTemplates) {
      return new PostgresTemplatesDataSource({
        connection: PostgresConnectionFactory.connectionConfig(),
        tenantId: tenant.name,
        mongoDb: db,
        transactionManager: mongoTM,
      });
    }

    return new MongoTemplatesDataSource({
      db,
      transactionManager: mongoTM,
      ...restOverrides,
    });
  }

  static cached(overrides?: Overrides) {
    const tenant = ExecutionContext.currentTenant;
    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    const { transactionManager: _ignored, ...restOverrides } = overrides ?? {};

    if (tenant.featureFlags?.postgresTemplates) {
      return new PostgresTemplatesDataSource({
        connection: PostgresConnectionFactory.connectionConfig(),
        tenantId: tenant.name,
        mongoDb: db,
        transactionManager: mongoTM,
      });
    }

    return new CachedMongoTemplatesDataSource({
      db,
      transactionManager: mongoTM,
      ...restOverrides,
    });
  }
}
