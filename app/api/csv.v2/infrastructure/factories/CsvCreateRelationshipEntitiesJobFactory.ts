import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { CsvCreateRelationshipEntitiesJob } from '../../application/jobs/CsvCreateRelationshipEntitiesJob.js';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';

type FactoryOptions = {
  transactionManager?: TransactionManager;
  jobsDispatcher?: JobsDispatcher;
};

class CsvCreateRelationshipEntitiesJobFactory {
  static default() {
    return this.build().useCase;
  }

  // eslint-disable-next-line max-statements
  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? ExecutionContext.transactionManager;
    const csvTransactionManager =
      CSVImportEntitiesFactories.csvTransactionManager(transactionManager);
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(csvTransactionManager);
    const relationshipValuesDS =
      CSVImportEntitiesFactories.CSVImportRelationshipValuesDSDefault(csvTransactionManager);
    const relationshipPendingValuesDS =
      CSVImportEntitiesFactories.CSVImportRelationshipPendingValuesDSDefault(csvTransactionManager);
    const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });
    const jobsDispatcher = options.jobsDispatcher ?? ExecutionContext.jobsDispatcher;
    const settingsDS = SettingsDataSourceFactory.cached({ transactionManager });
    const templatesDS = TemplatesDataSourceFactory.cached({ transactionManager });
    const entitiesService = EntitiesServiceFactory.default({
      transactionManager,
      settingsDS,
      templatesDS,
      entitiesDS,
    });

    const useCase = new CsvCreateRelationshipEntitiesJob({
      csvImportsDS,
      relationshipValuesDS,
      relationshipPendingValuesDS,
      entitiesDS,
      entitiesService,
      transactionManager,
      jobsDispatcher,
    });

    return {
      useCase,
      transactionManager,
      csvImportsDS,
      relationshipValuesDS,
      relationshipPendingValuesDS,
      entitiesDS,
    };
  }
}

export { CsvCreateRelationshipEntitiesJobFactory };
