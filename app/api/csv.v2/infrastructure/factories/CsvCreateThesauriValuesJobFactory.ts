import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
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
};

class CsvCreateThesauriValuesJobFactory {
  static default() {
    return this.build().useCase;
  }

  // eslint-disable-next-line max-statements
  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.default();
    let mongoTransactionManager: MongoTransactionManager | undefined;
    const getMongoTransactionManager = () => {
      if (mongoTransactionManager) {
        return mongoTransactionManager;
      }
      mongoTransactionManager =
        transactionManager instanceof MongoTransactionManager
          ? transactionManager
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
      options.jobsDispatcher ?? UwaziDispatcherFactory(tenants.current().name, transactionManager);
    const thesauriDS =
      options.thesauriDS ??
      ThesauriDataSourceFactory.default({ transactionManager: getMongoTransactionManager() });
    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager: getMongoTransactionManager(),
    });
    const translationsService = TranslationsServiceFactory.default({
      transactionManager: getMongoTransactionManager(),
    });
    const thesauriService = new ThesauriService({
      dispatcher: new DispatcherAdapter(jobsDispatcher),
      thesauriDS,
      thesaurusTranslationService: new ThesaurusTranslationService({
        settingsDS,
        translationsService,
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
