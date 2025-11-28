import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { BulkDeleteEntityUseCase } from 'api/core/application/BulkDeleteEntity';
import { search } from 'api/search';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';

class BulkDeleteEntityUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();
    const idGenerator = IdGeneratorFactory.default();
    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);

    const eventBus = applicationEventsBus;

    const useCase = new BulkDeleteEntityUseCase(
      {
        idGenerator,
        transactionManager,
        eventBus,
        entitiesDS,
        search,
      },
      { actor: permissionsContext.getUserInContext()!, tenant }
    );

    return useCase;
  }
}
export { BulkDeleteEntityUseCaseFactory };
