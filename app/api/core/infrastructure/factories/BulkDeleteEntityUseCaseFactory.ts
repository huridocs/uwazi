import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { search } from '#api/search/index.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { BulkDeleteEntityUseCase } from '#api/core/application/BulkDeleteEntity.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntityPermissionChecker } from '#api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker.js';
import { tenants } from '#api/tenants/index.js';

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
