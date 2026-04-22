import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { CsvImportEntitiesJob } from '../../application/jobs/CsvImportEntitiesJob.js';
import { CsvEntitiesImportMapper } from '../../application/services/CsvEntitiesImportMapper.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';

type FactoryOptions = {
  transactionManager?: MongoTransactionManager;
  fileStorage?: FileStorage;
  batchSize?: number;
  jobsDispatcher?: JobsDispatcher;
};

const buildCsvDataSources = (transactionManager: MongoTransactionManager) => {
  const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
  const rowsDS = CSVImportEntitiesFactories.CSVImportRowsDSDefault(transactionManager);
  const rowErrorsDS = CSVImportEntitiesFactories.CSVImportRowErrorsDSDefault(transactionManager);
  const thesauriValuesDS =
    CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(transactionManager);
  const relationshipValuesDS =
    CSVImportEntitiesFactories.CSVImportRelationshipValuesDSDefault(transactionManager);

  return {
    csvImportsDS,
    rowsDS,
    rowErrorsDS,
    thesauriValuesDS,
    relationshipValuesDS,
  };
};

const buildEntityServices = (
  transactionManager: MongoTransactionManager,
  fileStorage: FileStorage,
  jobsDispatcher: JobsDispatcher
) => {
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const entitiesDS = EntitiesDataSourceFactory.default(transactionManager);
  const filesService = FilesServiceFactory.default(transactionManager, { fileStorage });
  const idGenerator = IdGeneratorFactory.default();
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);
  const propertyAssignmentCreatorServiceStrategy = PropertyAssignmentCreatorServiceStrategy.create({
    settingsDS,
    thesauriDS,
    translationsDS,
    entitiesDS,
  });
  const entitiesService = EntitiesServiceFactory.default({
    transactionManager,
    settingsDS,
    templatesDS,
    entitiesDS,
    dispatcher: jobsDispatcher,
  });

  return {
    templatesDS,
    settingsDS,
    entitiesDS,
    entitiesService,
    filesService,
    idGenerator,
    propertyAssignmentCreatorServiceStrategy,
  };
};

class CsvImportEntitiesJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.default();
    const fileStorage = options.fileStorage ?? FileStorageFactory.default();
    const jobsDispatcher =
      options.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);
    const dataSources = buildCsvDataSources(transactionManager);
    const services = buildEntityServices(transactionManager, fileStorage, jobsDispatcher);
    const mapper = new CsvEntitiesImportMapper(
      dataSources.thesauriValuesDS,
      dataSources.relationshipValuesDS
    );

    const useCase = new CsvImportEntitiesJob({
      csvImportsDS: dataSources.csvImportsDS,
      rowsDS: dataSources.rowsDS,
      rowErrorsDS: dataSources.rowErrorsDS,
      thesauriValuesDS: dataSources.thesauriValuesDS,
      templatesDS: services.templatesDS,
      settingsDS: services.settingsDS,
      entitiesService: services.entitiesService,
      mapper,
      transactionManager,
      fileStorage,
      filesService: services.filesService,
      propertyAssignmentCreatorServiceStrategy: services.propertyAssignmentCreatorServiceStrategy,
      idGenerator: services.idGenerator,
      jobsDispatcher,
      batchSize: options.batchSize,
    });

    return {
      useCase,
      transactionManager,
      csvImportsDS: dataSources.csvImportsDS,
      rowsDS: dataSources.rowsDS,
      rowErrorsDS: dataSources.rowErrorsDS,
      entitiesDS: services.entitiesDS,
    };
  }
}

export { CsvImportEntitiesJobFactory };
