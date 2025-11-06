import { FileSystemStorage } from 'api/files.v2/infrastructure/FileSystemStorage';
import { PathManager } from 'api/files.v2/infrastructure/PathManager';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { tenants } from 'api/tenants/tenantContext';
import { DefaultCsvImportsDataSource } from '../database/data_source_defaults';
import { RegisterCsvImportUseCase } from './RegisterCsvImportUseCase';

export const RegisterCsvImportUseCaseFactory = () => {
  const transactionManager = TransactionManagerFactory.default();
  const csvImportsDS = DefaultCsvImportsDataSource(transactionManager);
  const tenant = tenants.current();
  const fileStorage = new FileSystemStorage(new PathManager({ tenant }));
  return new RegisterCsvImportUseCase({ csvImportsDS, fileStorage, transactionManager });
};
