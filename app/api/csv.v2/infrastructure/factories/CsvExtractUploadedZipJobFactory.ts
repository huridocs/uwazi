import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { tenants } from 'api/tenants/tenantContext';
import { CsvImportRowsStager } from '../../application/services/CsvImportRowsStager';
import { CsvImportFileNormalizer } from '../../application/services/CsvImportFileNormalizer';
import { CsvExtractUploadedZipJob } from '../../application/jobs/CsvExtractUploadedZipJob';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories';

type FactoryOptions = {
  transactionManager?: MongoTransactionManager;
  fileStorage?: FileStorage;
  batchSize?: number;
  jobsDispatcher?: JobsDispatcher;
};

class CsvExtractUploadedZipJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.default();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const rowsDS = CSVImportEntitiesFactories.CSVImportRowsDSDefault(transactionManager);
    const fileStorage = options.fileStorage ?? FileStorageFactory.default();
    const fileNormalizer = new CsvImportFileNormalizer({
      fileStorage,
      filesIO: new FileContentsIO(),
    });
    const rowsStager = new CsvImportRowsStager({ fileStorage }, { batchSize: options.batchSize });
    const jobsDispatcher =
      options.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);

    const useCase = new CsvExtractUploadedZipJob({
      csvImportsDS,
      fileNormalizer,
      rowsStager,
      rowsDS,
      transactionManager,
      jobsDispatcher,
    });

    return { useCase, transactionManager, csvImportsDS, rowsDS, fileStorage };
  }
}

export { CsvExtractUploadedZipJobFactory };
