import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { CsvPreflightJob } from '../../application/jobs/CsvPreflightJob.js';
import { CSVImportEntitiesFactories } from '../factories/CSVImportEntitiesFactories.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import { CsvImportRelationshipPendingValuesDataSource } from '../../application/contracts/CsvImportRelationshipPendingValuesDataSource.js';

type FactoryOptions = {
  transactionManager?: MongoTransactionManager;
  jobsDispatcher?: JobsDispatcher;
  csvImportsDS?: CsvImportsDataSource;
  rowsDS?: CsvImportRowsDataSource;
  templatesDS?: TemplatesDataSource;
  settingsDS?: SettingsDataSource;
  thesauriDS?: ThesauriDataSource;
  thesauriValuesDS?: CsvImportThesauriValuesDataSource;
  relationshipPendingValuesDS?: CsvImportRelationshipPendingValuesDataSource;
};

class CsvPreflightJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.default();
    const csvImportsDS =
      options.csvImportsDS ?? CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const rowsDS =
      options.rowsDS ?? CSVImportEntitiesFactories.CSVImportRowsDSDefault(transactionManager);
    const templatesDS =
      options.templatesDS ?? TemplatesDataSourceFactory.default({ transactionManager });
    const settingsDS =
      options.settingsDS ?? SettingsDataSourceFactory.default({ transactionManager });
    const thesauriDS =
      options.thesauriDS ?? ThesauriDataSourceFactory.default({ transactionManager });
    const thesauriValuesDS =
      options.thesauriValuesDS ??
      CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(transactionManager);
    const relationshipPendingValuesDS =
      options.relationshipPendingValuesDS ??
      CSVImportEntitiesFactories.CSVImportRelationshipPendingValuesDSDefault(transactionManager);
    const jobsDispatcher =
      options.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);

    const useCase = new CsvPreflightJob({
      csvImportsDS,
      rowsDS,
      templatesDS,
      settingsDS,
      thesauriDS,
      thesauriValuesDS,
      relationshipPendingValuesDS,
      jobsDispatcher,
      transactionManager,
    });

    return {
      useCase,
      transactionManager,
      csvImportsDS,
      rowsDS,
      thesauriValuesDS,
      relationshipPendingValuesDS,
    };
  }
}

export { CsvPreflightJobFactory };
