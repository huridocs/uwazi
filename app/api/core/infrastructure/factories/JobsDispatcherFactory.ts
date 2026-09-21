import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import {
  DefaultDispatcher,
  DefaultPostgresQueueAdapter,
  DefaultQueueAdapter,
} from '#api/core/libs/queue/configuration/factories.js';
import { QueueAdapter } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';
import { UwaziDispatcherFactory } from '../jobs/UwaziDispatcherFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

const SYSTEM_NAMESPACE = 'system';

type MongoQueueAdapterFactory = (transactionManager: TransactionManager) => QueueAdapter;

/**
 * Builds the one JobsDispatcher an ExecutionContext exposes. Wire it as the context's
 * `jobsDispatcher` factory; everything else reads ExecutionContext.jobsDispatcher.
 */
class JobsDispatcherFactory {
  /**
   * Dispatches into the current tenant's namespace, joining the context's transaction manager —
   * the one use cases run their transactions on, which the tenant's postgresCore flag selects. The
   * queue adapter follows that manager, so a dispatch always writes to the backend whose
   * transaction it joins.
   */
  static default(
    mongoQueueAdapter: MongoQueueAdapterFactory = DefaultQueueAdapter
  ): JobsDispatcher {
    const tenantName = ExecutionContext.currentTenant.name;
    const { transactionManager } = ExecutionContext;

    const queueAdapter =
      transactionManager instanceof PostgresTransactionManager
        ? DefaultPostgresQueueAdapter(transactionManager)
        : mongoQueueAdapter(transactionManager);

    return UwaziDispatcherFactory(tenantName, transactionManager, queueAdapter);
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
