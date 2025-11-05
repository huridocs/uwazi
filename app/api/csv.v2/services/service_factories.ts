import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { DefaultCsvImportsDataSource } from '../database/data_source_defaults';
import { RegisterCsvImportUseCase } from './RegisterCsvImportUseCase';

export const RegisterCsvImportUseCaseFactory = () => {
  const csvImportsDS = DefaultCsvImportsDataSource();
  const fileStorage = FileStorageStrategyFactory.createDefault();
  return new RegisterCsvImportUseCase({ csvImportsDS, fileStorage });
};
