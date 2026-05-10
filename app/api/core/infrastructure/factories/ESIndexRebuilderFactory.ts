import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ElasticSearchClientFactory } from '../elasticSearch/ElasticSearchClientFactory.js';
import { MongoSlotsBootstrapper } from '../elasticSearch/entities/MongoSlotsBootstrapper.js';
import { ESIndexRebuilder, ESIndexRebuilderDeps } from '../elasticSearch/ESIndexRebuilder.js';
import { IndexMappingRegistry } from '../elasticSearch/IndexMappingRegistry.js';
import { ElasticSearchBootstrapper } from '../elasticSearch/provision/ElasticSearchBootstrapper.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { EntityIndexerServiceFactory } from './EntityIndexerServiceFactory.js';
import { FullTextIndexerServiceFactory } from './FullTextIndexerServiceFactory.js';
import { SlotsReconcilerFactory } from './SlotsReconcilerFactory.js';

export class ESIndexRebuilderFactory {
  static default(overrides?: Partial<ESIndexRebuilderDeps>): ESIndexRebuilder {
    const database = getConnection();

    const slotsBootstrapper = new MongoSlotsBootstrapper({ database });
    const slotsReconciler = SlotsReconcilerFactory.default();

    const esClient = ElasticSearchClientFactory.getInstance();
    const esBootstrapper = new ElasticSearchBootstrapper({
      client: esClient,
      registry: IndexMappingRegistry,
      logger: ExecutionContext.logger,
    });
    const entityIndexer = EntityIndexerServiceFactory.default({ maxConcurrentWrites: 10 });
    const fullTextIndexer = FullTextIndexerServiceFactory.default({ maxConcurrentWrites: 10 });

    const rebuilder = new ESIndexRebuilder({
      transactionManager: ExecutionContext.transactionManager,
      esClient,
      esBootstrapper,
      entityIndexer,
      fullTextIndexer,
      slotsBootstrapper,
      slotsReconciler,
      registry: IndexMappingRegistry,
      logger: ExecutionContext.logger,
      ...overrides,
    });

    return rebuilder;
  }
}
