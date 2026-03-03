import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { BulkDeleteEntityUseCase } from '#api/core/application/BulkDeleteEntity.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class BulkDeleteEntityUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();

    const entitiesService = EntitiesServiceFactory.default({ transactionManager });

    const useCase = new BulkDeleteEntityUseCase(
      {
        transactionManager,
        entitiesService,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current()! }
    );

    return useCase;
  }
}
export { BulkDeleteEntityUseCaseFactory };
