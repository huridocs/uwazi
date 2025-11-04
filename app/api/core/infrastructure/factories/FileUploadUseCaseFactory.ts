import { FileUploadUseCase } from 'api/core/application/FileUploadUseCase';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileSystemStorage } from 'api/files.v2/infrastructure/FileSystemStorage';
import { PathManager } from 'api/files.v2/infrastructure/PathManager';
import { tenants } from 'api/tenants';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { PDFService } from '../services/PDFService';
import { IdGeneratorFactory } from './IdGeneratorFactory';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory';

class FileUploadUseCaseFactory {
  static default() {
    const db = getConnection();
    const transactionManager = TransactionManagerFactory.default();
    const filesDS = DefaultFilesDataSource(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const fileStorage = new FileSystemStorage(new PathManager({ tenant: tenants.current() }));
    const entitiesDS = new MongoMultiLanguageEntityDataSource(
      db,
      transactionManager,
      TemplatesDataSourceFactory.default(transactionManager)
    );

    const useCase = new FileUploadUseCase({
      pdfService: new PDFService(),
      filesDS,
      transactionManager,
      idGenerator,
      fileStorage,
      entitiesDS,
    });

    return useCase;
  }
}

export { FileUploadUseCaseFactory };
