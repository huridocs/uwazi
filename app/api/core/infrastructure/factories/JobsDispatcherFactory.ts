import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { UwaziDispatcherFactory } from '../jobs/UwaziDispatcherFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

const SYSTEM_NAMESPACE = 'system';

/**
 * Builds the one JobsDispatcher an ExecutionContext exposes. Wire it as the context's
 * `jobsDispatcher` factory; everything else reads ExecutionContext.jobsDispatcher.
 */
class JobsDispatcherFactory {
  /**
   * Dispatches into the current tenant's namespace.
   *
   * Every tenant's jobs are still stored in Mongo, and a Mongo adapter can only join a Mongo
   * session, so this stays on the Mongo transaction manager even for postgresCore tenants: handing
   * it ExecutionContext.transactionManager would make the dispatch look transactional while the
   * insert auto-commits. The adapter and the manager switch together, by the tenant's flag, once
   * the Postgres queue adapter exists.
   */
  static default(): JobsDispatcher {
    return UwaziDispatcherFactory(
      ExecutionContext.currentTenant.name,
      ExecutionContext.mongoTransactionManager
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
