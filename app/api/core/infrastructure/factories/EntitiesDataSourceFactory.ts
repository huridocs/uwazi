import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { EntityIndexerService } from '../elasticSearch/entities/EntityIndexerService';
import { MongoSlotsDAO } from '../elasticSearch/entities/MongoSlotsDAO';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { tenants } from '#api/tenants/index.js';

export class EntitiesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager): MultiLanguageEntityDataSource {
    const db = getConnection();

    const esClient = DependenciesContext.elasticClient;
    const slotsDAO = new MongoSlotsDAO({
      db,
      transactionManager,
      tenantName: tenants.current().name,
    });

    const entityIndexerService = new EntityIndexerService({
      esClient,
      slotsDAO,
    });

    return new MongoMultiLanguageEntityDataSource({ db, transactionManager, entityIndexerService });
  }
}
