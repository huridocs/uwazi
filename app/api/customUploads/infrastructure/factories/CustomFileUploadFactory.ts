import { CustomFileUpload } from '#api/customUploads/application/CustomFileUpload.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';

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
