import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoSlotsBootstrapper } from '../elasticSearch/entities/MongoSlotsBootstrapper.js';
import { TenantOnboarder, TenantOnboarderDeps } from '../elasticSearch/TenantOnboarder.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { EntityIndexerServiceFactory } from './EntityIndexerServiceFactory.js';
import { FullTextIndexerServiceFactory } from './FullTextIndexerServiceFactory.js';
import { LoggerFactory } from './LoggerFactory.js';
import { SlotsReconcilerFactory } from './SlotsReconcilerFactory.js';

export class TenantOnboarderFactory {
  static default(overrides?: Partial<TenantOnboarderDeps>): TenantOnboarder {
    const database = getConnection();
    const logger = LoggerFactory.default();

    const slotsBootstrapper = new MongoSlotsBootstrapper({
      database,
      transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
    });
    const slotsReconciler = SlotsReconcilerFactory.default();

    const entityIndexer = EntityIndexerServiceFactory.default();
    const fullTextIndexer = FullTextIndexerServiceFactory.default();

    const onboarder = new TenantOnboarder({
      entityIndexer,
      fullTextIndexer,
      slotsBootstrapper,
      slotsReconciler,
      transactionManager: ExecutionContext.transactionManager,
      logger,
      ...overrides,
    });

    return onboarder;
  }
}
