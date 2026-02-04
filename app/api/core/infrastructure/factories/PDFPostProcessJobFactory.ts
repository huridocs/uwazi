import { PDFPostProcessJob } from '#api/core/application/PDFPostProcessJob.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { PDFService } from '../services/PDFService.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';

class PDFPostProcessJobFactory {
  static default(
    transactionManager: MongoTransactionManager,
    deps: Partial<ConstructorParameters<typeof PDFPostProcessJob>[0]> = {}
  ) {
    return new PDFPostProcessJob({
      transactionManager,
      filesDS: FilesDataSourceFactory.default(transactionManager),
      filesService: FilesServiceFactory.default(transactionManager),
      eventBus: applicationEventsBus,
      fileStorage: FileStorageFactory.default(),
      pdfService: new PDFService(),
      idGenerator: IdGeneratorFactory.default(),
      ...deps,
    });
  }
}

export { PDFPostProcessJobFactory };
