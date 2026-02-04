import { CsvCreateThesauriValuesJob } from 'api/csv.v2/application/jobs/CsvCreateThesauriValuesJob';
import { CSVImportEntitiesFactories } from 'api/csv.v2/infrastructure/factories/CSVImportEntitiesFactories';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { tenants } from 'api/tenants/tenantContext';
import { LegacyThesauriRepository } from '../services/LegacyThesauriRepository';
import { LegacyTranslationsRepository } from '../services/LegacyTranslationsRepository';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource';
import { ThesauriRepository } from '../../application/contracts/ThesauriRepository';
import { TranslationsRepository } from '../../application/contracts/TranslationsRepository';

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
      thesauriRepo: options.thesauriRepo ?? new LegacyThesauriRepository(),
      translationsRepo: options.translationsRepo ?? new LegacyTranslationsRepository(),
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
