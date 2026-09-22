import { Db } from 'mongodb';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { CsvImportEntities } from '../../CsvImportEntities.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportEntitiesImportsDataSource } from '../../application/contracts/CsvImportEntitiesImportsDataSource.js';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import { CsvImportRowErrorsDataSource } from '../../application/contracts/CsvImportRowErrorsDataSource.js';
import { CsvImportRelationshipValuesDataSource } from '../../application/contracts/CsvImportRelationshipValuesDataSource.js';
import { CsvImportRelationshipPendingValuesDataSource } from '../../application/contracts/CsvImportRelationshipPendingValuesDataSource.js';
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
import { PostgresCsvImportRowsDataSource } from '../postgresql/PostgresCsvImportRowsDataSource.js';
import { PostgresCsvImportRowErrorsDataSource } from '../postgresql/PostgresCsvImportRowErrorsDataSource.js';
import { PostgresCsvImportThesauriValuesDataSource } from '../postgresql/PostgresCsvImportThesauriValuesDataSource.js';
import { PostgresCsvImportRelationshipPendingValuesDataSource } from '../postgresql/PostgresCsvImportRelationshipPendingValuesDataSource.js';
import { PostgresCsvImportRelationshipValuesDataSource } from '../postgresql/PostgresCsvImportRelationshipValuesDataSource.js';
import { PostgresCsvImportsDataSource } from '../postgresql/PostgresCsvImportsDataSource.js';

type CsvPostgresDeps = {
  tenantId: string;
  pgTransactionManager: PostgresTransactionManager;
};

const csvDataSource = <T>(
  transactionManager: TransactionManager | undefined,
  postgres: (deps: CsvPostgresDeps) => T,
  mongo: (db: Db, tm: TransactionManager) => T
): T => {
  if (ExecutionContext.currentTenant.featureFlags?.postgresCsv) {
    return postgres({
      tenantId: ExecutionContext.currentTenant.name,
      pgTransactionManager: ExecutionContext.postgresTransactionManager,
    });
  }
  return mongo(getConnection(), transactionManager ?? ExecutionContext.mongoTransactionManager);
};

type CsvImportsStore = CsvImportsDataSource & CsvImportEntitiesImportsDataSource;

export class CSVImportEntitiesFactories {
  static CSVImportDSDefault(transactionManager?: TransactionManager): CsvImportsStore {
    return csvDataSource<CsvImportsStore>(
      transactionManager,
      deps => new PostgresCsvImportsDataSource(deps),
      (db, tm) => new MongoCsvImportsDataSource(db, tm)
    );
  }

  static CSVImportRowsDSDefault(transactionManager?: TransactionManager): CsvImportRowsDataSource {
    return csvDataSource<CsvImportRowsDataSource>(
      transactionManager,
      deps => new PostgresCsvImportRowsDataSource(deps),
      (db, tm) => new MongoCsvImportRowsDataSource(db, tm)
    );
  }

  static CSVImportThesauriValuesDSDefault(
    transactionManager?: TransactionManager
  ): CsvImportThesauriValuesDataSource {
    return csvDataSource<CsvImportThesauriValuesDataSource>(
      transactionManager,
      deps => new PostgresCsvImportThesauriValuesDataSource(deps),
      (db, tm) => new MongoCsvImportThesauriValuesDataSource(db, tm)
    );
  }

  static CSVImportRowErrorsDSDefault(
    transactionManager?: TransactionManager
  ): CsvImportRowErrorsDataSource {
    return csvDataSource<CsvImportRowErrorsDataSource>(
      transactionManager,
      deps => new PostgresCsvImportRowErrorsDataSource(deps),
      (db, tm) => new MongoCsvImportRowErrorsDataSource(db, tm)
    );
  }

  static CSVImportRelationshipValuesDSDefault(
    transactionManager?: TransactionManager
  ): CsvImportRelationshipValuesDataSource {
    return csvDataSource<CsvImportRelationshipValuesDataSource>(
      transactionManager,
      deps => new PostgresCsvImportRelationshipValuesDataSource(deps),
      (db, tm) => new MongoCsvImportRelationshipValuesDataSource(db, tm)
    );
  }

  static CSVImportRelationshipPendingValuesDSDefault(
    transactionManager?: TransactionManager
  ): CsvImportRelationshipPendingValuesDataSource {
    return csvDataSource<CsvImportRelationshipPendingValuesDataSource>(
      transactionManager,
      deps => new PostgresCsvImportRelationshipPendingValuesDataSource(deps),
      (db, tm) => new MongoCsvImportRelationshipPendingValuesDataSource(db, tm)
    );
  }

  static default() {
    const { transactionManager } = ExecutionContext;
    const csvImportsDS = this.CSVImportDSDefault();
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
    return new CsvPreflightJob({
      csvImportsDS: this.CSVImportDSDefault(),
      rowsDS: this.CSVImportRowsDSDefault(),
      templatesDS: TemplatesDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      thesauriDS: ThesauriDataSourceFactory.default(),
      thesauriValuesDS: this.CSVImportThesauriValuesDSDefault(),
      relationshipPendingValuesDS: this.CSVImportRelationshipPendingValuesDSDefault(),
      jobsDispatcher: ExecutionContext.jobsDispatcher,
      transactionManager,
      idGenerator: IdGeneratorFactory.default(),
    });
  }

  static listCsvImportEntitiesImportsUseCaseDefault() {
    return new ListCsvImportEntitiesImportsUseCase({
      csvImportEntitiesImportsDS: this.CSVImportDSDefault(),
    });
  }

  static getCsvImportEntitiesImportUseCaseDefault() {
    return new GetCsvImportEntitiesImportUseCase({
      csvImportEntitiesImportsDS: this.CSVImportDSDefault(),
      rowErrorsDS: this.CSVImportRowErrorsDSDefault(),
    });
  }

  static cancelCsvImportEntitiesImportUseCaseDefault() {
    return new CancelCsvImportEntitiesImportUseCase({
      csvImportEntitiesImportsDS: this.CSVImportDSDefault(),
      sockets: new V1WebSocketsWrapper(),
    });
  }

  static downloadCsvImportFailedRowsCsvUseCaseDefault() {
    return new DownloadCsvImportFailedRowsCsvUseCase({
      csvImportEntitiesImportsDS: this.CSVImportDSDefault(),
      fileStorage: FileStorageFactory.default(),
    });
  }
}
