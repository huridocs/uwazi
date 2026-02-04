import { FilesService } from '#api/core/application/FilesService.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { tenants } from '#api/tenants/index.js';
import { FileContentsIO } from '../files/FileContentIO.js';
import { PathManager } from '../files/PathManager.js';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { PDFService } from '../services/PDFService.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';

class FilesServiceFactory {
  static default(
    transactionManager: MongoTransactionManager,
    deps: Partial<ConstructorParameters<typeof FilesService>[0]> = {}
  ) {
    return new FilesService({
      transactionManager,
      filesDS: FilesDataSourceFactory.default(transactionManager),
      relV1DS: new MongoRelationshipsV1DataSource(getConnection(), transactionManager),
      pathManager: new PathManager({ tenant: tenants.current() }),
      idGenerator: IdGeneratorFactory.default(),
      fileStorage: FileStorageFactory.default(),
      jobsDispatcher: DefaultDispatcher(tenants.current().name, transactionManager),
      pdfService: new PDFService(),
      filesIO: new FileContentsIO(),
      eventBus: applicationEventsBus,
      ...deps,
    });
  }
}

export { FilesServiceFactory };
