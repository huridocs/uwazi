import { FileUploadUseCase } from 'api/core/application/FileUploadUseCase';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileSystemStorage } from 'api/files.v2/infrastructure/FileSystemStorage';
import { PathManager } from 'api/files.v2/infrastructure/PathManager';
import { tenants } from 'api/tenants';
import { PDFService } from '../services/PDFService';
import { IdGeneratorFactory } from './IdGeneratorFactory';

class FileUploadUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const filesDS = DefaultFilesDataSource(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const fileStorage = new FileSystemStorage(new PathManager({ tenant: tenants.current() }));

    const useCase = new FileUploadUseCase({
      pdfService: new PDFService(),
      filesDS,
      transactionManager,
      idGenerator,
      fileStorage,
    });

    return useCase;
  }
}

export { FileUploadUseCaseFactory };
