import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { tenants } from 'api/tenants/tenantContext';
import { EntitiesServiceFactory } from 'api/core/infrastructure/factories/EntitiesServiceFactory';
import { CsvCreateRelationshipEntitiesJob } from '../../application/jobs/CsvCreateRelationshipEntitiesJob';
import { CSVImportEntitiesFactories } from './CSVImportEntitiesFactories';

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
    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
    const jobsDispatcher =
      options.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);
    const entitiesService = EntitiesServiceFactory.default({ transactionManager });

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
