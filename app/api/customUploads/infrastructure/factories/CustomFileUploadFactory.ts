import { CustomFileUpload } from '#api/customUploads/application/CustomFileUpload.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
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
        filesDS: FilesDataSourceFactory.default(),
        fileStorage: FileStorageFactory.default(),
        eventBus: applicationEventsBus,
      },
      {
        actor: ExecutionContext.actor,
        tenant: ExecutionContext.tenant,
      }
    );
  }
}
