import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoEntitiesDataSource } from '#api/core/infrastructure/mongodb/entity/MongoEntitiesDataSource.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = Partial<
  Omit<ConstructorParameters<typeof MongoEntitiesDataSource>[0], 'transactionManager'>
> & {
  transactionManager?: TransactionManager;
};

export class EntitiesDataSourceFactory {
  static default(overrides?: Overrides): EntitiesDataSource {
    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;

    const { transactionManager: _ignored, ...restOverrides } = overrides ?? {};

    return new MongoEntitiesDataSource({
      db,
      transactionManager: mongoTM,
      ...restOverrides,
    });
  }
}
