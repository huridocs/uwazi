import { BulkDeleteEntityUseCase } from '#api/core/application/BulkDeleteEntity.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class BulkDeleteEntityUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof BulkDeleteEntityUseCase>[0]>) {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    const entitiesService = EntitiesServiceFactory.default({ transactionManager, ...overrides });

    const useCase = new BulkDeleteEntityUseCase(
      {
        transactionManager,
        entitiesService,
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );

    return useCase;
  }
}
export { BulkDeleteEntityUseCaseFactory };
