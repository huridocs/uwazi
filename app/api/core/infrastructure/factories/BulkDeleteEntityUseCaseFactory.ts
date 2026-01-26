import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { BulkDeleteEntityUseCase } from 'api/core/application/BulkDeleteEntity';
import { EntitiesServiceFactory } from './EntitiesServiceFactory';

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
