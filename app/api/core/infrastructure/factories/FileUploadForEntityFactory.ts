import { FileUploadForEntity } from 'api/core/application/FileUploadForEntity';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';
import { FilesServiceFactory } from './FilesServiceFactory';
import { IdGeneratorFactory } from './IdGeneratorFactory';

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
