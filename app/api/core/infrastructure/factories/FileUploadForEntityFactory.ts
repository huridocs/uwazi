import { FileUploadForEntity } from '#api/core/application/FileUploadForEntity.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';

export class FileUploadForEntityFactory {
  static default(
    transactionManager: MongoTransactionManager,
    depsOverwrite: Partial<ConstructorParameters<typeof FileUploadForEntity>[0]> = {}
  ) {
    return new FileUploadForEntity(
      {
        transactionManager,
        idGenerator: IdGeneratorFactory.default(),
        entitiesDS: new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager),
        filesService: FilesServiceFactory.default(transactionManager),
        eventBus: applicationEventsBus,
        ...depsOverwrite,
      },
      {
        actor: permissionsContext.getUserInContext()!,
        tenant: tenants.current(),
      }
    );
  }
}
