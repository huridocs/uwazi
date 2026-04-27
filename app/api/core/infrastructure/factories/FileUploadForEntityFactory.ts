import { FileUploadForEntity } from '#api/core/application/FileUploadForEntity.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class FileUploadForEntityFactory {
  static default(overrides: Partial<ConstructorParameters<typeof FileUploadForEntity>[0]> = {}) {
    const transactionManager =
      (overrides.transactionManager as MongoTransactionManager | undefined) ??
      TransactionManagerFactory.default();

    return new FileUploadForEntity(
      {
        transactionManager,
        idGenerator: IdGeneratorFactory.default(),
        entitiesDS: EntitiesDataSourceFactory.default(transactionManager),
        filesService: FilesServiceFactory.default(),
        eventBus: applicationEventsBus,
        ...overrides,
      },
      {
        actor: ExecutionContext.actor,
        tenant: ExecutionContext.tenant,
      }
    );
  }
}
