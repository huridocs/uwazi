import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { CsvCreateRelationshipEntitiesJob } from '../../application/jobs/CsvCreateRelationshipEntitiesJob.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';

type FactoryOptions = {
  transactionManager?: TransactionManager;
  jobsDispatcher?: JobsDispatcher;
};

const csvRelationshipDataSources = () => ({
  csvImportsDS: CSVImportEntitiesFactories.CSVImportDSDefault(),
  relationshipValuesDS: CSVImportEntitiesFactories.CSVImportRelationshipValuesDSDefault(),
  relationshipPendingValuesDS:
    CSVImportEntitiesFactories.CSVImportRelationshipPendingValuesDSDefault(),
});

const csvRelationshipCore = (options: FactoryOptions) => {
  const entitiesDS = EntitiesDataSourceFactory.default();
  return {
    entitiesDS,
    jobsDispatcher: options.jobsDispatcher ?? ExecutionContext.jobsDispatcher,
    entitiesService: EntitiesServiceFactory.default({
      settingsDS: SettingsDataSourceFactory.cached(),
      templatesDS: TemplatesDataSourceFactory.cached(),
      entitiesDS,
    }),
  };
};

class CsvCreateRelationshipEntitiesJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? ExecutionContext.transactionManager;
    const dataSources = csvRelationshipDataSources();
    const core = csvRelationshipCore(options);

    const useCase = new CsvCreateRelationshipEntitiesJob({
      ...dataSources,
      ...core,
      transactionManager,
      idGenerator: IdGeneratorFactory.default(),
    });

    return {
      useCase,
      transactionManager,
      ...dataSources,
      entitiesDS: core.entitiesDS,
    };
  }
}

export { CsvCreateRelationshipEntitiesJobFactory };
