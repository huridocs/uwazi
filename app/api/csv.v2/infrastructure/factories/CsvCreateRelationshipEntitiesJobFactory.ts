import { CsvCreateRelationshipEntitiesJob } from '../../application/jobs/CsvCreateRelationshipEntitiesJob';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { tenants } from 'api/tenants/tenantContext';

type FactoryOptions = {
  transactionManager?: MongoTransactionManager;
  jobsDispatcher?: JobsDispatcher;
};

class CsvCreateRelationshipEntitiesJobFactory {
  static default() {
    return this.build().useCase;
  }

  static build(options: FactoryOptions = {}) {
    const transactionManager = options.transactionManager ?? TransactionManagerFactory.default();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const relationshipValuesDS =
      CSVImportEntitiesFactories.CSVImportRelationshipValuesDSDefault(transactionManager);
    const relationshipPendingValuesDS =
      CSVImportEntitiesFactories.CSVImportRelationshipPendingValuesDSDefault(transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
    const jobsDispatcher =
      options.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);

    const useCase = new CsvCreateRelationshipEntitiesJob({
      csvImportsDS,
      relationshipValuesDS,
      relationshipPendingValuesDS,
      templatesDS,
      settingsDS,
      entitiesDS,
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
