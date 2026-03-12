import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { CsvCreateThesauriValuesJob } from '../../application/jobs/CsvCreateThesauriValuesJob.js';
import { CsvThesauriRepository } from '../services/CsvThesauriRepository.js';
import { CsvTranslationsRepository } from '../services/CsvTranslationsRepository.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import { ThesauriRepository } from '../../application/contracts/ThesauriRepository.js';
import { TranslationsRepository } from '../../application/contracts/TranslationsRepository.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';

type FactoryOptions = {
  transactionManager?: MongoTransactionManager;
  jobsDispatcher?: JobsDispatcher;
  csvImportsDS?: CsvImportsDataSource;
  thesauriValuesDS?: CsvImportThesauriValuesDataSource;
  thesauriRepo?: ThesauriRepository;
  translationsRepo?: TranslationsRepository;
};

class CsvCreateThesauriValuesJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.default();
    const csvImportsDS =
      options.csvImportsDS ?? CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const thesauriValuesDS =
      options.thesauriValuesDS ??
      CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(transactionManager);
    const jobsDispatcher =
      options.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);

    const useCase = new CsvCreateThesauriValuesJob({
      csvImportsDS,
      thesauriValuesDS,
      thesauriRepo: options.thesauriRepo ?? new CsvThesauriRepository(transactionManager),
      translationsRepo: options.translationsRepo ?? new CsvTranslationsRepository(transactionManager),
      transactionManager,
      jobsDispatcher,
    });

    return {
      useCase,
      transactionManager,
      csvImportsDS,
      thesauriValuesDS,
    };
  }
}

export { CsvCreateThesauriValuesJobFactory };
