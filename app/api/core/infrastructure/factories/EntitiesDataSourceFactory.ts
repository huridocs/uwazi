import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = Partial<
  Omit<ConstructorParameters<typeof MongoMultiLanguageEntityDataSource>[0], 'transactionManager'>
> & {
  transactionManager?: TransactionManager;
};

export class EntitiesDataSourceFactory {
  static default(overrides?: Overrides): MultiLanguageEntityDataSource {
    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;

    const { transactionManager: _ignored, ...restOverrides } = overrides ?? {};

    return new MongoMultiLanguageEntityDataSource({
      db,
      transactionManager: mongoTM,
      ...restOverrides,
    });
  }
}
