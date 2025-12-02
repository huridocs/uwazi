import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { BulkCleanupEntityUseCase } from 'api/core/application/BulkCleanupEntity';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { FilesServiceFactory } from './FilesServiceFactory';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource';

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
