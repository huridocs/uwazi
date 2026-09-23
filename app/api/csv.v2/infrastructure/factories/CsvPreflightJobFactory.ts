import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { CsvPreflightJob } from '../../application/jobs/CsvPreflightJob.js';
import { CSVImportEntitiesFactories } from '../factories/CSVImportEntitiesFactories.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import { CsvImportRelationshipPendingValuesDataSource } from '../../application/contracts/CsvImportRelationshipPendingValuesDataSource.js';

type FactoryOptions = {
  transactionManager?: TransactionManager;
  jobsDispatcher?: JobsDispatcher;
  csvImportsDS?: CsvImportsDataSource;
  rowsDS?: CsvImportRowsDataSource;
  templatesDS?: TemplatesDataSource;
  settingsDS?: SettingsDataSource;
  thesauriDS?: ThesauriDataSource;
  thesauriValuesDS?: CsvImportThesauriValuesDataSource;
  relationshipPendingValuesDS?: CsvImportRelationshipPendingValuesDataSource;
};

const csvPreflightDataSources = (options: FactoryOptions) => ({
  csvImportsDS: options.csvImportsDS ?? CSVImportEntitiesFactories.CSVImportDSDefault(),
  rowsDS: options.rowsDS ?? CSVImportEntitiesFactories.CSVImportRowsDSDefault(),
  templatesDS: options.templatesDS ?? TemplatesDataSourceFactory.default(),
  settingsDS: options.settingsDS ?? SettingsDataSourceFactory.default(),
  thesauriDS: options.thesauriDS ?? ThesauriDataSourceFactory.default(),
  thesauriValuesDS:
    options.thesauriValuesDS ?? CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(),
  relationshipPendingValuesDS:
    options.relationshipPendingValuesDS ??
    CSVImportEntitiesFactories.CSVImportRelationshipPendingValuesDSDefault(),
});

class CsvPreflightJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? ExecutionContext.transactionManager;
    const dataSources = csvPreflightDataSources(options);
    const jobsDispatcher = options.jobsDispatcher ?? ExecutionContext.jobsDispatcher;

    const useCase = new CsvPreflightJob({
      ...dataSources,
      jobsDispatcher,
      transactionManager,
      idGenerator: IdGeneratorFactory.default(),
    });

    return {
      useCase,
      transactionManager,
      csvImportsDS: dataSources.csvImportsDS,
      rowsDS: dataSources.rowsDS,
      thesauriValuesDS: dataSources.thesauriValuesDS,
      relationshipPendingValuesDS: dataSources.relationshipPendingValuesDS,
    };
  }
}

export { CsvPreflightJobFactory };
