import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { CsvImportEntitiesJob } from '../../application/jobs/CsvImportEntitiesJob.js';
import { CsvEntitiesImportMapper } from '../../application/services/CsvEntitiesImportMapper.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';

type FactoryOptions = {
  transactionManager?: TransactionManager;
  fileStorage?: FileStorage;
  batchSize?: number;
  jobsDispatcher?: JobsDispatcher;
};

const buildCsvDataSources = () => {
  const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault();
  const rowsDS = CSVImportEntitiesFactories.CSVImportRowsDSDefault();
  const rowErrorsDS = CSVImportEntitiesFactories.CSVImportRowErrorsDSDefault();
  const thesauriValuesDS = CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault();
  const relationshipValuesDS = CSVImportEntitiesFactories.CSVImportRelationshipValuesDSDefault();

  return {
    csvImportsDS,
    rowsDS,
    rowErrorsDS,
    thesauriValuesDS,
    relationshipValuesDS,
  };
};

const buildPropertyAssignmentCreator = (params: {
  settingsDS: ReturnType<typeof SettingsDataSourceFactory.default>;
  entitiesDS: ReturnType<typeof EntitiesDataSourceFactory.default>;
}) => {
  const translationsDS = TranslationsDataSourceFactory.default();
  const thesauriDS = ThesauriDataSourceFactory.default();
  return PropertyAssignmentCreatorServiceStrategy.create({
    settingsDS: params.settingsDS,
    thesauriDS,
    translationsDS,
    entitiesDS: params.entitiesDS,
  });
};

const buildEntitiesService = (params: {
  jobsDispatcher: JobsDispatcher;
  settingsDS: ReturnType<typeof SettingsDataSourceFactory.default>;
  templatesDS: ReturnType<typeof TemplatesDataSourceFactory.default>;
  entitiesDS: ReturnType<typeof EntitiesDataSourceFactory.default>;
}) =>
  EntitiesServiceFactory.default({
    settingsDS: params.settingsDS,
    templatesDS: params.templatesDS,
    entitiesDS: params.entitiesDS,
    dispatcher: new DispatcherAdapter(params.jobsDispatcher),
  });

const buildEntityServices = (fileStorage: FileStorage, jobsDispatcher: JobsDispatcher) => {
  const templatesDS = TemplatesDataSourceFactory.default();
  const settingsDS = SettingsDataSourceFactory.default();
  const entitiesDS = EntitiesDataSourceFactory.default();
  const filesDS = FilesDataSourceFactory.default();
  const filesService = FilesServiceFactory.default({ fileStorage, filesDS });
  const propertyAssignmentCreatorServiceStrategy = buildPropertyAssignmentCreator({
    settingsDS,
    entitiesDS,
  });
  const entitiesService = buildEntitiesService({
    jobsDispatcher,
    settingsDS,
    templatesDS,
    entitiesDS,
  });

  return {
    templatesDS,
    settingsDS,
    entitiesDS,
    entitiesService,
    filesService,
    filesDS,
    idGenerator: IdGeneratorFactory.default(),
    propertyAssignmentCreatorServiceStrategy,
  };
};

class CsvImportEntitiesJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? ExecutionContext.transactionManager;
    const fileStorage = options.fileStorage ?? FileStorageFactory.default();
    const jobsDispatcher =
      options.jobsDispatcher ??
      UwaziDispatcherFactory(
        ExecutionContext.tenant.name,
        ExecutionContext.mongoTransactionManager
      );
    const dataSources = buildCsvDataSources();
    const services = buildEntityServices(fileStorage, jobsDispatcher);
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
      entitiesDS: services.entitiesDS,
      filesDS: services.filesDS,
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
      relationshipValuesDS: dataSources.relationshipValuesDS,
      entitiesDS: services.entitiesDS,
    };
  }
}

export { CsvImportEntitiesJobFactory };
