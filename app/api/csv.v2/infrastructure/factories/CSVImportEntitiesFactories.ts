import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { CsvImportEntities } from '../../CsvImportEntities.js';
import { ListCsvImportEntitiesImportsUseCase } from '../../application/useCases/ListCsvImportEntitiesImportsUseCase.js';
import { GetCsvImportEntitiesImportUseCase } from '../../application/useCases/GetCsvImportEntitiesImportUseCase.js';
import { CancelCsvImportEntitiesImportUseCase } from '../../application/useCases/CancelCsvImportEntitiesImportUseCase.js';
import { DownloadCsvImportFailedRowsCsvUseCase } from '../../application/useCases/DownloadCsvImportFailedRowsCsvUseCase.js';
import { CsvPreflightJob } from '../../application/jobs/CsvPreflightJob.js';
import { MongoCsvImportsDataSource } from '../mongodb/MongoCsvImportsDataSource.js';
import { MongoCsvImportRowsDataSource } from '../mongodb/MongoCsvImportRowsDataSource.js';
import { MongoCsvImportThesauriValuesDataSource } from '../mongodb/MongoCsvImportThesauriValuesDataSource.js';
import { MongoCsvImportRowErrorsDataSource } from '../mongodb/MongoCsvImportRowErrorsDataSource.js';
import { MongoCsvImportRelationshipValuesDataSource } from '../mongodb/MongoCsvImportRelationshipValuesDataSource.js';
import { MongoCsvImportRelationshipPendingValuesDataSource } from '../mongodb/MongoCsvImportRelationshipPendingValuesDataSource.js';

export class CSVImportEntitiesFactories {
  /**
   * The manager for the CSV import collections, which only exist in Mongo: the given one when it
   * is a Mongo manager, the context's Mongo manager otherwise (postgresCore tenants).
   */
  static csvTransactionManager(transactionManager: TransactionManager): MongoTransactionManager {
    return transactionManager instanceof MongoTransactionManager
      ? transactionManager
      : ExecutionContext.mongoTransactionManager;
  }

  static CSVImportDSDefault(transactionManager: TransactionManager) {
    const db = getConnection();
    return new MongoCsvImportsDataSource(db, transactionManager);
  }

  static CSVImportRowsDSDefault(transactionManager: TransactionManager) {
    const db = getConnection();
    return new MongoCsvImportRowsDataSource(db, transactionManager);
  }

  static CSVImportThesauriValuesDSDefault(transactionManager: TransactionManager) {
    const db = getConnection();
    return new MongoCsvImportThesauriValuesDataSource(db, transactionManager);
  }

  static CSVImportRowErrorsDSDefault(transactionManager: TransactionManager) {
    const db = getConnection();
    return new MongoCsvImportRowErrorsDataSource(db, transactionManager);
  }

  static CSVImportRelationshipValuesDSDefault(transactionManager: TransactionManager) {
    const db = getConnection();
    return new MongoCsvImportRelationshipValuesDataSource(db, transactionManager);
  }

  static CSVImportRelationshipPendingValuesDSDefault(transactionManager: TransactionManager) {
    const db = getConnection();
    return new MongoCsvImportRelationshipPendingValuesDataSource(db, transactionManager);
  }

  static default() {
    const { transactionManager } = ExecutionContext;
    const csvImportsDS = this.CSVImportDSDefault(this.csvTransactionManager(transactionManager));
    const fileStorage = FileStorageFactory.default();
    const idGenerator = IdGeneratorFactory.default();
    const { jobsDispatcher } = ExecutionContext;
    return new CsvImportEntities({
      csvImportsDS,
      fileStorage,
      transactionManager,
      idGenerator,
      jobsDispatcher,
    });
  }

  static CSVPreflightJobDefault() {
    const { transactionManager } = ExecutionContext;
    const csvTransactionManager = this.csvTransactionManager(transactionManager);
    const csvImportsDS = this.CSVImportDSDefault(csvTransactionManager);
    const templatesDS = TemplatesDataSourceFactory.default({ transactionManager });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
    const { jobsDispatcher } = ExecutionContext;
    return new CsvPreflightJob({
      csvImportsDS,
      rowsDS: this.CSVImportRowsDSDefault(csvTransactionManager),
      templatesDS,
      settingsDS,
      thesauriDS,
      thesauriValuesDS: this.CSVImportThesauriValuesDSDefault(csvTransactionManager),
      relationshipPendingValuesDS:
        this.CSVImportRelationshipPendingValuesDSDefault(csvTransactionManager),
      jobsDispatcher,
      transactionManager,
    });
  }

  static listCsvImportEntitiesImportsUseCaseDefault() {
    const transactionManager = ExecutionContext.mongoTransactionManager;
    const csvImportEntitiesImportsDS = this.CSVImportDSDefault(transactionManager);

    return new ListCsvImportEntitiesImportsUseCase({
      csvImportEntitiesImportsDS,
    });
  }

  static getCsvImportEntitiesImportUseCaseDefault() {
    const transactionManager = ExecutionContext.mongoTransactionManager;
    const csvImportEntitiesImportsDS = this.CSVImportDSDefault(transactionManager);
    const rowErrorsDS = this.CSVImportRowErrorsDSDefault(transactionManager);

    return new GetCsvImportEntitiesImportUseCase({
      csvImportEntitiesImportsDS,
      rowErrorsDS,
    });
  }

  static cancelCsvImportEntitiesImportUseCaseDefault() {
    const transactionManager = ExecutionContext.mongoTransactionManager;
    const csvImportEntitiesImportsDS = this.CSVImportDSDefault(transactionManager);

    return new CancelCsvImportEntitiesImportUseCase({
      csvImportEntitiesImportsDS,
      sockets: new V1WebSocketsWrapper(),
    });
  }

  static downloadCsvImportFailedRowsCsvUseCaseDefault() {
    const transactionManager = ExecutionContext.mongoTransactionManager;
    const csvImportEntitiesImportsDS = this.CSVImportDSDefault(transactionManager);
    const fileStorage = FileStorageFactory.default();

    return new DownloadCsvImportFailedRowsCsvUseCase({
      csvImportEntitiesImportsDS,
      fileStorage,
    });
  }
}
