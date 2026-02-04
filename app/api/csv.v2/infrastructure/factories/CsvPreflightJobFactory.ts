import { CsvPreflightJob } from 'api/csv.v2/application/jobs/CsvPreflightJob';
import { CSVImportEntitiesFactories } from 'api/csv.v2/infrastructure/factories/CSVImportEntitiesFactories';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { tenants } from 'api/tenants/tenantContext';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';

type FactoryOptions = {
  transactionManager?: MongoTransactionManager;
  jobsDispatcher?: JobsDispatcher;
  csvImportsDS?: CsvImportsDataSource;
  rowsDS?: CsvImportRowsDataSource;
  templatesDS?: TemplatesDataSource;
  settingsDS?: SettingsDataSource;
  thesauriDS?: MongoThesauriDataSource;
  thesauriValuesDS?: CsvImportThesauriValuesDataSource;
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
      options.templatesDS ?? TemplatesDataSourceFactory.default(transactionManager);
    const settingsDS = options.settingsDS ?? SettingsDataSourceFactory.default(transactionManager);
    const thesauriDS =
      options.thesauriDS ?? new MongoThesauriDataSource(getConnection(), transactionManager);
    const thesauriValuesDS =
      options.thesauriValuesDS ??
      CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(transactionManager);
    const jobsDispatcher =
      options.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);

    const useCase = new CsvPreflightJob({
      csvImportsDS,
      rowsDS,
      templatesDS,
      settingsDS,
      thesauriDS,
      thesauriValuesDS,
      jobsDispatcher,
      transactionManager,
    });

    return {
      useCase,
      transactionManager,
      csvImportsDS,
      rowsDS,
      thesauriValuesDS,
    };
  }
}

export { CsvPreflightJobFactory };
