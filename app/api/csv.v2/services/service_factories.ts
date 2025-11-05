import { DefaultCsvImportsDataSource } from '../database/data_source_defaults';
import { FileStorageAdapter } from '../database/FileStorageAdapter';
import { RegisterCsvImportUseCase } from './RegisterCsvImportUseCase';

export const RegisterCsvImportUseCaseFactory = () => {
  const csvImportsDS = DefaultCsvImportsDataSource();
  const fileStorage = new FileStorageAdapter();
  return new RegisterCsvImportUseCase({ csvImportsDS, fileStorage });
};
