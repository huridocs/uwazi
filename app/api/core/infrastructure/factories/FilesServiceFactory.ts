import { FilesService } from 'api/core/application/FilesService';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { SyncDispatcherForTests } from 'api/core/libs/queue/infrastructure/SyncDispatcherForTests';
import { tenants } from 'api/tenants';
import { FileContentsIO } from '../files/FileContentIO';
import { PathManager } from '../files/PathManager';
import { DeleteFileFromStorageJobHandler } from '../jobs/DeleteFileFromStorageJobHandler';
import { PDFPostProcessJob } from '../jobs/PDFPostProcessJob';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { PDFService } from '../services/PDFService';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper';
import { IdGeneratorFactory } from './IdGeneratorFactory';
import { TransactionManagerFactory } from './TransactionManagerFactory';

class FilesServiceFactory {
  static default(
    transactionManager: MongoTransactionManager,
    deps: Partial<ConstructorParameters<typeof FilesService>[0]> = {}
  ) {
    let _transactionManager = transactionManager;
    if (process.env.NODE_ENV !== 'test' && !_transactionManager) {
      _transactionManager = TransactionManagerFactory.default();
    }
    const filesDS = FilesDataSourceFactory.default(_transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const fileStorage = FileStorageFactory.default();

    let jobsDispatcher: JobsDispatcher = new SyncDispatcherForTests({
      DeleteFileFromStorageJobHandler: async () =>
        new DeleteFileFromStorageJobHandler({ fileStorage: FileStorageFactory.default() }),
      PDFPostProcessJob: async () =>
        new PDFPostProcessJob({
          useCase: new PDFPostProcess({
            eventBus: applicationEventsBus,
            transactionManager: _transactionManager,
            filesDS,
            fileStorage,
            pdfService: new PDFService(),
            idGenerator,
            filesService: new FilesService({
              pathManager: new PathManager({ tenant: tenants.current() }),
              idGenerator: IdGeneratorFactory.default(),
              fileStorage: FileStorageFactory.default(),
              filesDS: FilesDataSourceFactory.default(_transactionManager),
              jobsDispatcher,
              pdfService: new PDFService(),
              filesIO: new FileContentsIO(),
              relV1DS: new MongoRelationshipsV1DataSource(getConnection(), _transactionManager),
              transactionManager: _transactionManager,
              eventBus: applicationEventsBus,
            }),
          }),
          wSockets: new V1WebSocketsWrapper(),
        }),
    });

    if (process.env.NODE_ENV !== 'test') {
      jobsDispatcher = DefaultDispatcher(tenants.current().name);
    }

    return new FilesService({
      pathManager: new PathManager({ tenant: tenants.current() }),
      idGenerator: IdGeneratorFactory.default(),
      fileStorage: FileStorageFactory.default(),
      filesDS: FilesDataSourceFactory.default(_transactionManager),
      jobsDispatcher,
      pdfService: new PDFService(),
      filesIO: new FileContentsIO(),
      relV1DS: new MongoRelationshipsV1DataSource(getConnection(), _transactionManager),
      transactionManager: _transactionManager,
      eventBus: applicationEventsBus,
      ...deps,
    });
  }
}

export { FilesServiceFactory };
