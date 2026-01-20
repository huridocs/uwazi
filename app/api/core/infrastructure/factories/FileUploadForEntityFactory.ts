import { FileUploadForEntity } from '#api/core/application/FileUploadForEntity.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';

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
