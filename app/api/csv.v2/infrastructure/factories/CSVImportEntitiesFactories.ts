import { FileSystemStorage } from 'api/core/infrastructure/files/FileSystemStorage';
import { PathManager } from 'api/core/infrastructure/files/PathManager';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { tenants } from 'api/tenants/tenantContext';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { CsvImportEntities } from '../../CsvImportEntities';
import { CsvPreflightJob } from '../../application/jobs/CsvPreflightJob';
import { MongoCsvImportsDataSource } from '../mongodb/MongoCsvImportsDataSource';
import { MongoCsvImportRowsDataSource } from '../mongodb/MongoCsvImportRowsDataSource';
import { MongoCsvImportThesauriValuesDataSource } from '../mongodb/MongoCsvImportThesauriValuesDataSource';
import { MongoCsvImportRowErrorsDataSource } from '../mongodb/MongoCsvImportRowErrorsDataSource';

export class CSVImportEntitiesFactories {
  static CSVImportDSDefault(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoCsvImportsDataSource(db, transactionManager);
  }

  static CSVImportRowsDSDefault(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoCsvImportRowsDataSource(db, transactionManager);
  }

  static CSVImportThesauriValuesDSDefault(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoCsvImportThesauriValuesDataSource(db, transactionManager);
  }

  static CSVImportRowErrorsDSDefault(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoCsvImportRowErrorsDataSource(db, transactionManager);
  }

  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = this.CSVImportDSDefault(transactionManager);
    const tenant = tenants.current();
    const fileStorage = new FileSystemStorage(new PathManager({ tenant }));
    const idGenerator = IdGeneratorFactory.default();
    const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);
    return new CsvImportEntities({
      csvImportsDS,
      fileStorage,
      transactionManager,
      idGenerator,
      jobsDispatcher,
    });
  }

  static CSVPreflightJobDefault() {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = this.CSVImportDSDefault(transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
    const tenant = tenants.current();
    const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);
    return new CsvPreflightJob({
      csvImportsDS,
      rowsDS: this.CSVImportRowsDSDefault(transactionManager),
      templatesDS,
      settingsDS,
      thesauriDS,
      thesauriValuesDS: this.CSVImportThesauriValuesDSDefault(transactionManager),
      jobsDispatcher,
      transactionManager,
    });
  }
}
