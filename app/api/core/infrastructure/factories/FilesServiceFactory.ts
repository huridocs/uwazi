import { FilesService } from 'api/core/application/FilesService';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { SyncDispatcherForTests } from 'api/core/libs/queue/infrastructure/SyncDispatcherForTests';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { tenants } from 'api/tenants';
import { FileContentsIO } from '../files/FileContentIO';
import { PDFPostProcessJob } from '../jobs/PDFPostProcessJob';
import { PDFService } from '../services/PDFService';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper';
import { IdGeneratorFactory } from './IdGeneratorFactory';
import { TransactionManagerFactory } from './TransactionManagerFactory';

class FilesServiceFactory {
  static default() {
    let transactionManager = TransactionManagerFactory.fake();

    if (process.env.NODE_ENV !== 'test') {
      transactionManager = TransactionManagerFactory.default();
    }
    const filesDS = FilesDataSourceFactory.default(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const fileStorage = FileStorageFactory.default();

    let jobsDispatcher: JobsDispatcher = new SyncDispatcherForTests({
      PDFPostProcessJob: async () =>
        new PDFPostProcessJob({
          useCase: new PDFPostProcess({
            transactionManager,
            filesDS,
            fileStorage,
            pdfService: new PDFService(),
            idGenerator,
            filesIO: new FileContentsIO(),
            filesService: new FilesService({
              idGenerator: IdGeneratorFactory.default(),
              fileStorage: FileStorageFactory.default(),
              filesDS: FilesDataSourceFactory.default(transactionManager),
              jobsDispatcher,
              pdfService: new PDFService(),
              filesIO: new FileContentsIO(),
            }),
          }),
          wSockets: new V1WebSocketsWrapper(),
        }),
    });

    if (process.env.NODE_ENV !== 'test') {
      jobsDispatcher = DefaultDispatcher(tenants.current().name);
    }

    return new FilesService({
      idGenerator: IdGeneratorFactory.default(),
      fileStorage: FileStorageFactory.default(),
      filesDS: FilesDataSourceFactory.default(transactionManager),
      jobsDispatcher,
      pdfService: new PDFService(),
      filesIO: new FileContentsIO(),
    });
  }
}

export { FilesServiceFactory };
