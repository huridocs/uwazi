import { CustomFileUpload } from 'api/customUploads/application/CustomFileUpload';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';

export class CustomFileUploadFactory {
  static default(transactionManager: MongoTransactionManager) {
    return new CustomFileUpload(
      {
        transactionManager,
        idGenerator: IdGeneratorFactory.default(),
        filesDS: FilesDataSourceFactory.default(transactionManager),
        fileStorage: FileStorageFactory.default(),
        eventBus: applicationEventsBus,
      },
      {
        actor: permissionsContext.getUserInContext()!,
        tenant: tenants.current(),
      }
    );
  }
}
