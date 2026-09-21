import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { ThesaurusTranslationService } from '#api/core/application/thesaurusTranslationService/ThesaurusTranslationService.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
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

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? ExecutionContext.transactionManager;
    const csvImportsDS = options.csvImportsDS ?? CSVImportEntitiesFactories.CSVImportDSDefault();
    const thesauriValuesDS =
      options.thesauriValuesDS ?? CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault();
    const jobsDispatcher =
      options.jobsDispatcher ??
      UwaziDispatcherFactory(
        ExecutionContext.tenant.name,
        ExecutionContext.mongoTransactionManager
      );
    const thesauriDS = options.thesauriDS ?? ThesauriDataSourceFactory.default();
    const thesauriService = new ThesauriService({
      dispatcher: new DispatcherAdapter(jobsDispatcher),
      thesauriDS,
      thesaurusTranslationService: new ThesaurusTranslationService({
        settingsDS: SettingsDataSourceFactory.default(),
        translationsDS: TranslationsDataSourceFactory.default(),
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
