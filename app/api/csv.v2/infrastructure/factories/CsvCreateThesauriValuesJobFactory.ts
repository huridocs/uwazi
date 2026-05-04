import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { CsvCreateThesauriValuesJob } from '../../application/jobs/CsvCreateThesauriValuesJob.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';

type FactoryOptions = {
  transactionManager?: TransactionManager;
  jobsDispatcher?: JobsDispatcher;
  csvImportsDS?: CsvImportsDataSource;
  thesauriValuesDS?: CsvImportThesauriValuesDataSource;
  thesauriDS?: ThesauriDataSource;
  translationsDS?: TranslationsDataSource;
};

class CsvCreateThesauriValuesJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.default();
    let mongoTransactionManager: MongoTransactionManager | undefined;
    const getMongoTransactionManager = () => {
      if (mongoTransactionManager) {
        return mongoTransactionManager;
      }
      mongoTransactionManager =
        options.transactionManager instanceof MongoTransactionManager
          ? options.transactionManager
          : TransactionManagerFactory.default();
      return mongoTransactionManager;
    };
    const csvImportsDS =
      options.csvImportsDS ??
      CSVImportEntitiesFactories.CSVImportDSDefault(getMongoTransactionManager());
    const thesauriValuesDS =
      options.thesauriValuesDS ??
      CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(getMongoTransactionManager());
    const jobsDispatcher =
      options.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);

    const useCase = new CsvCreateThesauriValuesJob({
      csvImportsDS,
      thesauriValuesDS,
      thesauriDS:
        options.thesauriDS ??
        ThesauriDataSourceFactory.default({ transactionManager: getMongoTransactionManager() }),
      translationsDS:
        options.translationsDS ?? DefaultTranslationsDataSource(getMongoTransactionManager()),
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
