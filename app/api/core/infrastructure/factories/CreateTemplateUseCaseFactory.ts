import { FileUploadUseCase } from 'api/core/application/FileUploadUseCase';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';

class CreateTemplateUseCaseFactory {
  static create() {
    const transactionManager = TransactionManagerFactory.default();
    const filesDS = DefaultFilesDataSource(transactionManager);

    const useCase = new FileUploadUseCase({
      filesDS,
      transactionManager,
    });

    return useCase;
  }
}

export { CreateTemplateUseCaseFactory };
