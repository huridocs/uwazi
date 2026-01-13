import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { search } from 'api/search';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { BulkDeleteEntityUseCase } from 'api/core/application/BulkDeleteEntity';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker';

class BulkDeleteEntityUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
    const entityPermissionChecker = new MongoEntityPermissionChecker(
      getConnection(),
      transactionManager
    );

    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
    const useCase = new BulkDeleteEntityUseCase(
      {
        entitiesDS,
        entityPermissionChecker,
        search,
        jobsDispatcher,
        transactionManager,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current()! }
    );

    return useCase;
  }
}
export { BulkDeleteEntityUseCaseFactory };
