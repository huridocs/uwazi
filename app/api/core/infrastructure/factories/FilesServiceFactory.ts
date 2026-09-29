import {
  FilesService,
  FilesServiceContext,
  FilesServiceDeps,
} from '#api/core/application/FilesService.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FileContentsIO } from '../files/FileContentIO.js';
import { PathManager } from '../files/PathManager.js';
import { PDFService } from '../services/PDFService.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';
import { RelationshipsV1DataSourceFactory } from './RelationshipsV1DataSourceFactory.js';

class FilesServiceFactory {
  static default(deps: Partial<FilesServiceDeps> = {}, context?: FilesServiceContext) {
    const { transactionManager } = ExecutionContext;

    return new FilesService(
      {
        transactionManager,
        filesDS: FilesDataSourceFactory.default(),
        relV1DS: deps.relV1DS ?? RelationshipsV1DataSourceFactory.default(),
        pathManager: new PathManager({ tenant: ExecutionContext.tenant }),
        idGenerator: IdGeneratorFactory.default(),
        fileStorage: FileStorageFactory.default(),
        jobsDispatcher: DispatcherFactory.default(),
        pdfService: new PDFService(),
        filesIO: new FileContentsIO(),
        eventBus: applicationEventsBus,
        ...deps,
      },
      context ?? {
        userId: ExecutionContext.actor?._id?.toString(),
        tenantName: ExecutionContext.tenant.name,
      }
    );
  }
}

export { FilesServiceFactory };
