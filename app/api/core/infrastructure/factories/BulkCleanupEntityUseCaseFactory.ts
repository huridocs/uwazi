import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { BulkCleanupEntityUseCase } from '#api/core/application/BulkCleanupEntity.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';

class BulkCleanupEntityUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof BulkCleanupEntityUseCase>[0]>) {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const idGenerator = IdGeneratorFactory.default();
    const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });
    const relationshipsDS = new MongoRelationshipsV1DataSource(getConnection(), transactionManager);
    const eventBus = applicationEventsBus;
    const filesService = FilesServiceFactory.default();

    return new BulkCleanupEntityUseCase(
      {
        idGenerator,
        transactionManager,
        eventBus,
        entitiesDS,
        relationshipsDS,
        filesService,
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );
  }
}
export { BulkCleanupEntityUseCaseFactory };
