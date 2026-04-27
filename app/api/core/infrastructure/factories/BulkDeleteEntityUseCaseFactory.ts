import { EntitiesServiceDeps } from '#api/core/application/EntitiesService.js';
import { BulkDeleteEntityUseCase } from '#api/core/application/BulkDeleteEntity.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class BulkDeleteEntityUseCaseFactory {
  static default(overrides?: Partial<EntitiesServiceDeps>) {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    const entitiesService = EntitiesServiceFactory.default({ transactionManager, ...overrides });

    const useCase = new BulkDeleteEntityUseCase(
      {
        transactionManager,
        entitiesService,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );

    return useCase;
  }
}
export { BulkDeleteEntityUseCaseFactory };
