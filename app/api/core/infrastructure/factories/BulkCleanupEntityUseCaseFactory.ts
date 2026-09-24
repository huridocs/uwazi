import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { BulkCleanupEntityUseCase } from '#api/core/application/BulkCleanupEntity.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { RelationshipsV1DataSourceFactory } from './RelationshipsV1DataSourceFactory.js';

class BulkCleanupEntityUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof BulkCleanupEntityUseCase>[0]>) {
    const { transactionManager } = ExecutionContext;
    const idGenerator = IdGeneratorFactory.default();
    const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });
    const relationshipsDS = RelationshipsV1DataSourceFactory.default();
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
