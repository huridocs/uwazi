import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { BulkCleanupEntityUseCase } from '#api/core/application/BulkCleanupEntity.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';

class BulkCleanupEntityUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();
    const idGenerator = IdGeneratorFactory.default();
    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
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
