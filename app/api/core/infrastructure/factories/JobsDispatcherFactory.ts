import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import {
  DefaultDispatcher,
  DefaultPostgresQueueAdapter,
} from '#api/core/libs/queue/configuration/factories.js';
import { QueueAdapter } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';
import { UwaziDispatcherFactory } from '../jobs/UwaziDispatcherFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

const SYSTEM_NAMESPACE = 'system';

type MongoQueueAdapterFactory = () => QueueAdapter;

/**
 * Builds the one JobsDispatcher an ExecutionContext exposes. Wire it as the context's
 * `jobsDispatcher` factory; everything else reads ExecutionContext.jobsDispatcher.
 *
 * Inserting a job is not part of the use case's transaction: the queue adapters never get the
 * transaction manager the use case runs on, so every dispatch commits on its own.
 */
class JobsDispatcherFactory {
  /** Dispatches into the current tenant's namespace, on the backend its postgresCore flag selects. */
  static default(mongoQueueAdapter?: MongoQueueAdapterFactory): JobsDispatcher {
    const queueAdapter = isPostgresCoreActive()
      ? DefaultPostgresQueueAdapter()
      : mongoQueueAdapter?.();

    return UwaziDispatcherFactory(
      ExecutionContext.currentTenant.name,
      TransactionManagerFactory.createForSharedDataBase(),
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
