import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { ThesauriDataSourceFactory } from 'api/core/infrastructure/factories/ThesauriDataSourceFactory';
import { FilesServiceFactory } from 'api/core/infrastructure/factories/FilesServiceFactory';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { CsvImportEntitiesJob } from '../../application/jobs/CsvImportEntitiesJob';
import { CsvEntitiesImportMapper } from '../../application/services/CsvEntitiesImportMapper';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories';

type FactoryOptions = {
  transactionManager?: MongoTransactionManager;
  fileStorage?: FileStorage;
  batchSize?: number;
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
  fileStorage: FileStorage
) => {
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
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

  return {
    templatesDS,
    settingsDS,
    entitiesDS,
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
    const dataSources = buildCsvDataSources(transactionManager);
    const services = buildEntityServices(transactionManager, fileStorage);
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
      entitiesDS: services.entitiesDS,
      mapper,
      transactionManager,
      fileStorage,
      filesService: services.filesService,
      propertyAssignmentCreatorServiceStrategy: services.propertyAssignmentCreatorServiceStrategy,
      idGenerator: services.idGenerator,
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
