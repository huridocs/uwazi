import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultCsvImportsDataSource } from '../database/data_source_defaults';
import { RegisterCsvImportUseCase } from './RegisterCsvImportUseCase';

export const RegisterCsvImportUseCaseFactory = () => {
  const csvImportsDS = DefaultCsvImportsDataSource();
  const fileStorage = FileStorageStrategyFactory.createDefault();
  const transactionManager = TransactionManagerFactory.default();
  return new RegisterCsvImportUseCase({ csvImportsDS, fileStorage, transactionManager });
};
