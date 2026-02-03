import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { MongoThesauriDataSource } from '#api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { CsvImportEntities } from '../../CsvImportEntities.js';
import { CsvPreflightJob } from '../../application/jobs/CsvPreflightJob.js';
import { MongoCsvImportsDataSource } from '../mongodb/MongoCsvImportsDataSource.js';
import { MongoCsvImportRowsDataSource } from '../mongodb/MongoCsvImportRowsDataSource.js';
import { MongoCsvImportThesauriValuesDataSource } from '../mongodb/MongoCsvImportThesauriValuesDataSource.js';

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
