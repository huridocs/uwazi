import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoEntitiesDataSource } from '#api/core/infrastructure/mongodb/entity/MongoEntitiesDataSource.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';

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

    const { transactionManager: _ignored, options: overriddenOptions, ...restOverrides } =
      overrides ?? {};

    const templatesDAO = TemplatesDAOFactory.default();

    const actor = ExecutionContext.actor;
    const accessContext = overriddenOptions?.accessContext ?? (actor ? AccessContext.forActor(actor) : undefined);

    return new MongoEntitiesDataSource({
      db,
      transactionManager: mongoTM,
      templatesDAO,
      options: {
        accessContext,
        ...overriddenOptions,
      },
      ...restOverrides,
    });
  }
}
