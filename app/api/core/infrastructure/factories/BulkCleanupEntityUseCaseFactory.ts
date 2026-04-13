import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { BulkCleanupEntityUseCase } from '#api/core/application/BulkCleanupEntity.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';

class BulkCleanupEntityUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();
    const idGenerator = IdGeneratorFactory.default();
    const entitiesDS = EntitiesDataSourceFactory.default(transactionManager);
    const relationshipsDS = new MongoRelationshipsV1DataSource(getConnection(), transactionManager);
    const eventBus = applicationEventsBus;
    const filesService = FilesServiceFactory.default(transactionManager);

    const useCase = new BulkCleanupEntityUseCase(
      {
        idGenerator,
        transactionManager,
        eventBus,
        entitiesDS,
        relationshipsDS,
        filesService,
      },
      { actor: permissionsContext.getUserInContext()!, tenant }
    );

    return useCase;
  }
}
export { BulkCleanupEntityUseCaseFactory };
