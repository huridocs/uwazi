import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { CsvCreateThesauriValuesJob } from '../../application/jobs/CsvCreateThesauriValuesJob.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

type FactoryOptions = {
  transactionManager?: TransactionManager;
  jobsDispatcher?: JobsDispatcher;
  csvImportsDS?: CsvImportsDataSource;
  thesauriValuesDS?: CsvImportThesauriValuesDataSource;
  thesauriDS?: ThesauriDataSource;
};

class CsvCreateThesauriValuesJobFactory {
  static default() {
    return this.build().useCase;
  }

  // eslint-disable-next-line max-statements
  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? ExecutionContext.transactionManager;
    let mongoTransactionManager: MongoTransactionManager | undefined;
    const getMongoTransactionManager = () => {
      if (mongoTransactionManager) {
        return mongoTransactionManager;
      }
      mongoTransactionManager =
        CSVImportEntitiesFactories.csvTransactionManager(transactionManager);
      return mongoTransactionManager;
    };
    const csvImportsDS =
      options.csvImportsDS ??
      CSVImportEntitiesFactories.CSVImportDSDefault(getMongoTransactionManager());
    const thesauriValuesDS =
      options.thesauriValuesDS ??
      CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(getMongoTransactionManager());
    const jobsDispatcher = options.jobsDispatcher ?? ExecutionContext.jobsDispatcher;
    const thesauriDS =
      options.thesauriDS ??
      ThesauriDataSourceFactory.default({ transactionManager: getMongoTransactionManager() });
    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager: getMongoTransactionManager(),
    });
    const translationsDS = TranslationsDataSourceFactory.default({
      transactionManager: getMongoTransactionManager(),
    });
    const thesauriService = new ThesauriService({
      dispatcher: DispatcherFactory.default(jobsDispatcher),
      thesauriDS,
      thesaurusTranslationService: new ThesaurusTranslationService({
        settingsDS,
        translationsDS,
      }),
    });

    const useCase = new CsvCreateThesauriValuesJob({
      csvImportsDS,
      thesauriValuesDS,
      thesauriDS,
      thesauriService,
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
