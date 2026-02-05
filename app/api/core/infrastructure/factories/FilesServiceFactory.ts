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
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';

class FilesServiceFactory {
  static default(
    transactionManager: MongoTransactionManager,
    deps: Partial<ConstructorParameters<typeof FilesService>[0]> = {}
  ) {
    let jobsDispatcher: JobsDispatcher;

    // Use provided dispatcher from deps, or create a new one
    if (deps.jobsDispatcher) {
      jobsDispatcher = deps.jobsDispatcher;
    } else if (process.env.NODE_ENV === 'test') {
      // In test environment, use a no-op dispatcher that doesn't create jobs in DB
      jobsDispatcher = {
        async dispatch() {
          // No-op: don't create jobs in test DB
        },
        async dispatchMany(callback) {
          // No-op: don't create jobs in test DB
          await callback(async () => {});
        },
        async deleteByParams() {
          // No-op: nothing to delete
        },
      };
    } else {
      jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
    }

    return new FilesService({
      transactionManager,
      filesDS: FilesDataSourceFactory.default(transactionManager),
      relV1DS: new MongoRelationshipsV1DataSource(getConnection(), transactionManager),
      pathManager: new PathManager({ tenant: tenants.current() }),
      idGenerator: IdGeneratorFactory.default(),
      fileStorage: FileStorageFactory.default(),
      jobsDispatcher,
      pdfService: new PDFService(),
      filesIO: new FileContentsIO(),
      eventBus: applicationEventsBus,
      ...deps,
    });
  }
}

export { FilesServiceFactory };
