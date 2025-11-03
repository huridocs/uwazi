import { FileUploadUseCase } from 'api/core/application/FileUploadUseCase';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { PDFService } from '../services/PDFService';
import { IdGeneratorFactory } from './IdGeneratorFactory';

class FileUploadUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const filesDS = DefaultFilesDataSource(transactionManager);
    const idGenerator = IdGeneratorFactory.default();

    const useCase = new FileUploadUseCase({
      pdfService: new PDFService(),
      filesDS,
      transactionManager,
      idGenerator,
    });

    return useCase;
  }
}

export { FileUploadUseCaseFactory };
