import { FileUploadUseCase } from 'api/core/application/FileUploadUseCase';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { SyncDispatcherForTests } from 'api/core/libs/queue/infrastructure/SyncDispatcherForTests';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { PDFPostProcessJob } from '../jobs/PDFPostProcessJob';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { PDFService } from '../services/PDFService';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper';
import { IdGeneratorFactory } from './IdGeneratorFactory';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory';

class FileUploadUseCaseFactory {
  static default() {
    const db = getConnection();
    const transactionManager = TransactionManagerFactory.default();
    const filesDS = DefaultFilesDataSource(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const fileStorage = FileStorageStrategyFactory.createDefault();
    const entitiesDS = new MongoMultiLanguageEntityDataSource(
      db,
      transactionManager,
      TemplatesDataSourceFactory.default(transactionManager)
    );

    let jobsDispatcher: JobsDispatcher = new SyncDispatcherForTests({
      PDFPostProcessJob: async () =>
        new PDFPostProcessJob({
          useCase: new PDFPostProcess({
            transactionManager,
            filesDS,
            fileStorage,
            pdfService: new PDFService(),
            idGenerator,
          }),
          wSockets: new V1WebSocketsWrapper(),
        }),
    });

    if (process.env.NODE_ENV !== 'test') {
      jobsDispatcher = DefaultDispatcher(tenants.current().name);
    }
    const useCase = new FileUploadUseCase(
      {
        filesDS,
        transactionManager,
        idGenerator,
        fileStorage,
        entitiesDS,
        jobsDispatcher,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current() }
    );

    return useCase;
  }
}

export { FileUploadUseCaseFactory };
