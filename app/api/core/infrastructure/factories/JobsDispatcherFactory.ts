import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import {
  DefaultDispatcher,
  DefaultPostgresQueueAdapter,
  DefaultQueueAdapter,
} from '#api/core/libs/queue/configuration/factories.js';
import { QueueAdapter } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { UwaziDispatcherFactory } from '../jobs/UwaziDispatcherFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

const SYSTEM_NAMESPACE = 'system';

type MongoQueueAdapterFactory = (transactionManager: MongoTransactionManager) => QueueAdapter;

/**
 * Builds the one JobsDispatcher an ExecutionContext exposes. Wire it as the context's
 * `jobsDispatcher` factory; everything else reads ExecutionContext.jobsDispatcher.
 *
 * A dispatch joins the transaction the use case runs on: postgresCore tenants get the Postgres
 * adapter on the context's Postgres manager, other tenants the Mongo adapter on its Mongo manager.
 * Those are the instances ExecutionContext.transactionManager resolves to for the same flag.
 */
class JobsDispatcherFactory {
  /** Dispatches into the current tenant's namespace, on the backend its postgresCore flag selects. */
  static default(
    mongoQueueAdapter: MongoQueueAdapterFactory = DefaultQueueAdapter
  ): JobsDispatcher {
    const queueAdapter = isPostgresCoreActive()
      ? DefaultPostgresQueueAdapter(ExecutionContext.postgresTransactionManager)
      : mongoQueueAdapter(ExecutionContext.mongoTransactionManager);

    return UwaziDispatcherFactory(
      ExecutionContext.currentTenant.name,
      ExecutionContext.transactionManager,
      queueAdapter
    );
  }

  /** Dispatches into the 'system' namespace (migrations, scheduled maintenance jobs). */
  static system(): JobsDispatcher {
    return DefaultDispatcher(SYSTEM_NAMESPACE, TransactionManagerFactory.createForSharedDataBase());
  }

  /** The dispatcher for a job running in `namespace`, so its follow-up jobs land in the same one. */
  static forNamespace(namespace: string): JobsDispatcher {
    return namespace === SYSTEM_NAMESPACE ? this.system() : this.default();
  }
}

export { JobsDispatcherFactory };
