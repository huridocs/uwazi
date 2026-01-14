import { FilesService } from 'api/core/application/FilesService';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';
import { FileContentsIO } from '../files/FileContentIO';
import { PathManager } from '../files/PathManager';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { PDFService } from '../services/PDFService';
import { IdGeneratorFactory } from './IdGeneratorFactory';

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
