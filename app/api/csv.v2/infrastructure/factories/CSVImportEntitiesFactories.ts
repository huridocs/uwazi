import { FileSystemStorage } from 'api/files.v2/infrastructure/FileSystemStorage';
import { PathManager } from 'api/files.v2/infrastructure/PathManager';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { tenants } from 'api/tenants/tenantContext';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { DefaultCsvImportsDataSource } from '../data_source_defaults';
import { CsvImportEntities } from '../../CsvImportEntities';
import { CsvPreflightJob } from '../../application/jobs/CsvPreflightJob';
import { DefaultCsvImportRowsDataSource } from '../csv_import_rows_defaults';
import { DefaultCsvImportThesauriValuesDataSource } from '../csv_import_thesauri_values_defaults';

export class CSVImportEntitiesFactories {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = DefaultCsvImportsDataSource(transactionManager);
    const tenant = tenants.current();
    const fileStorage = new FileSystemStorage(new PathManager({ tenant }));
    const idGenerator = IdGeneratorFactory.default();
    const jobsDispatcher = DefaultDispatcher(tenant.name);
    return new CsvImportEntities({
      csvImportsDS,
      fileStorage,
      transactionManager,
      idGenerator,
      jobsDispatcher,
    });
  }

  static CSVPreflightJobFactory() {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = DefaultCsvImportsDataSource(transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
    return new CsvPreflightJob({
      csvImportsDS,
      rowsDS: DefaultCsvImportRowsDataSource(transactionManager),
      templatesDS,
      settingsDS,
      thesauriDS,
      thesauriValuesDS: DefaultCsvImportThesauriValuesDataSource(transactionManager),
    });
  }
}
