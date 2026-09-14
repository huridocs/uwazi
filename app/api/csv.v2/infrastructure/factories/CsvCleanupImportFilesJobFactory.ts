import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { CsvCleanupImportFilesJob } from '../../application/jobs/CsvCleanupImportFilesJob.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';

type FactoryOptions = {
  transactionManager?: TransactionManager;
  fileStorage?: FileStorage;
};

class CsvCleanupImportFilesJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.mongo();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const fileStorage = options.fileStorage ?? FileStorageFactory.default();

    const useCase = new CsvCleanupImportFilesJob({
      csvImportsDS,
      fileStorage,
      transactionManager,
    });

    return {
      useCase,
      transactionManager,
      csvImportsDS,
      fileStorage,
    };
  }
}

export { CsvCleanupImportFilesJobFactory };
