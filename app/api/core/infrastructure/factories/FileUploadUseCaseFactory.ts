import { FileUploadUseCase } from 'api/core/application/FileUploadUseCase';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { FilesServiceFactory } from './FilesServiceFactory';
import { IdGeneratorFactory } from './IdGeneratorFactory';
import { TransactionManagerFactory } from './TransactionManagerFactory';

class FileUploadUseCaseFactory {
  static default() {
    const db = getConnection();
    let transactionManager = TransactionManagerFactory.fake();

    if (process.env.NODE_ENV !== 'test') {
      transactionManager = TransactionManagerFactory.default();
    }
    const idGenerator = IdGeneratorFactory.default();
    const entitiesDS = new MongoMultiLanguageEntityDataSource(db, transactionManager);
    const filesService = FilesServiceFactory.default();
    const eventBus = applicationEventsBus;

    const useCase = new FileUploadUseCase(
      {
        transactionManager,
        idGenerator,
        entitiesDS,
        filesService,
        eventBus,
      },
      {
        actor: permissionsContext.getUserInContext()!,
        tenant: tenants.current(),
      }
    );

    return useCase;
  }
}

export { FileUploadUseCaseFactory };
