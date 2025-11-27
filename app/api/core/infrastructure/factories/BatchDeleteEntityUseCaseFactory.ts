import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { BatchDeleteEntityUseCase } from 'api/core/application/BatchDeleteEntity';
import { search } from 'api/search';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';

class BatchDeleteEntityUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();
    const idGenerator = IdGeneratorFactory.default();
    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);

    const eventBus = applicationEventsBus;

    const useCase = new BatchDeleteEntityUseCase(
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
export { BatchDeleteEntityUseCaseFactory };
