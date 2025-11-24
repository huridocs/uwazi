import { FileSystemStorage } from 'api/core/infrastructure/files/FileSystemStorage';
import { PathManager } from 'api/core/infrastructure/files/PathManager';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { tenants } from 'api/tenants/tenantContext';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { DefaultCsvImportsDataSource } from '../database/data_source_defaults';
import { RegisterCsvImportUseCase } from './RegisterCsvImportUseCase';

export const RegisterCsvImportUseCaseFactory = () => {
  const transactionManager = TransactionManagerFactory.default();
  const csvImportsDS = DefaultCsvImportsDataSource(transactionManager);
  const tenant = tenants.current();
  const fileStorage = new FileSystemStorage(new PathManager({ tenant }));
  const idGenerator = IdGeneratorFactory.default();
  const jobsDispatcher = DefaultDispatcher(tenant.name);
  return new RegisterCsvImportUseCase({
    csvImportsDS,
    fileStorage,
    transactionManager,
    idGenerator,
    jobsDispatcher,
  });
};
