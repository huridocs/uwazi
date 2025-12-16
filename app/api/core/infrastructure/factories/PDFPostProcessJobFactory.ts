import { PDFPostProcessJob } from 'api/core/application/PDFPostProcessJob';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';
import { PDFService } from '../services/PDFService';
import { FilesServiceFactory } from './FilesServiceFactory';
import { IdGeneratorFactory } from './IdGeneratorFactory';

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
