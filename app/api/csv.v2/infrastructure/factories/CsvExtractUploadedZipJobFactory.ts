import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { CsvImportRowsStager } from '../../application/services/CsvImportRowsStager.js';
import { CsvImportFileNormalizer } from '../../application/services/CsvImportFileNormalizer.js';
import { CsvExtractUploadedZipJob } from '../../application/jobs/CsvExtractUploadedZipJob.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';

type FactoryOptions = {
  transactionManager?: TransactionManager;
  fileStorage?: FileStorage;
  batchSize?: number;
  jobsDispatcher?: JobsDispatcher;
};

class CsvExtractUploadedZipJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.mongo();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const rowsDS = CSVImportEntitiesFactories.CSVImportRowsDSDefault(transactionManager);
    const fileStorage = options.fileStorage ?? FileStorageFactory.default();
    const fileNormalizer = new CsvImportFileNormalizer({
      fileStorage,
      filesIO: new FileContentsIO(),
    });
    const rowsStager = new CsvImportRowsStager({ fileStorage }, { batchSize: options.batchSize });
    const jobsDispatcher = options.jobsDispatcher ?? ExecutionContext.jobsDispatcher;

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
