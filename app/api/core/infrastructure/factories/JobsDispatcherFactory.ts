import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { config } from '#api/config.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import {
  DefaultDispatcher,
  DefaultPostgresQueueAdapter,
  DefaultQueueAdapter,
} from '#api/core/libs/queue/configuration/factories.js';
import { QueueAdapter, PushJobInput } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { PostgresTransactionManager } from '../postgresql/common/PostgresTransactionManager.js';
import { UwaziDispatcherFactory } from '../jobs/UwaziDispatcherFactory.js';
import { LoggerFactory } from './LoggerFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

const SYSTEM_NAMESPACE = 'system';

/**
 * The Uwazi-specific tenant scope for a pushed job, written into the jobs table as tenant_id.
 * Tenant jobs are scoped by their namespace (the tenant name); system jobs belong to no tenant.
 */
const tenantIdForJob = (job: PushJobInput): { tenant_id: string | null } => ({
  tenant_id: job.namespace === SYSTEM_NAMESPACE ? null : job.namespace,
});

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
      ? DefaultPostgresQueueAdapter(ExecutionContext.postgresTransactionManager, tenantIdForJob)
      : mongoQueueAdapter(ExecutionContext.mongoTransactionManager);

    return UwaziDispatcherFactory(
      ExecutionContext.currentTenant.name,
      ExecutionContext.transactionManager,
      queueAdapter
    );
  }

  /**
   * Dispatches into the current tenant's namespace on the Mongo queue, whatever its postgresCore
   * flag. Transitional: lets a postgresCore tenant reach jobs dispatched before it switched.
   */
  static mongoQueue(
    mongoQueueAdapter: MongoQueueAdapterFactory = DefaultQueueAdapter
  ): JobsDispatcher {
    return UwaziDispatcherFactory(
      ExecutionContext.currentTenant.name,
      ExecutionContext.mongoTransactionManager,
      mongoQueueAdapter(ExecutionContext.mongoTransactionManager)
    );
  }

  /**
   * Dispatches into the 'system' namespace (migrations, scheduled maintenance jobs) on the store
   * selected by SYSTEM_JOBS_BACKEND. System jobs have no tenant, so Postgres rows get a null one.
   */
  static system(): JobsDispatcher {
    if (config.systemJobsBackend === 'postgres') {
      const transactionManager = new PostgresTransactionManager(
        PostgresDB.pipelinedPool(),
        config.defaultTenant.name,
        LoggerFactory.systemLogger()
      );

      return DefaultDispatcher(
        SYSTEM_NAMESPACE,
        transactionManager,
        DefaultPostgresQueueAdapter(transactionManager, tenantIdForJob)
      );
    }

    return DefaultDispatcher(SYSTEM_NAMESPACE, TransactionManagerFactory.createForSharedDataBase());
  }

  /** The dispatcher for a job running in `namespace`, so its follow-up jobs land in the same one. */
  static forNamespace(namespace: string): JobsDispatcher {
    return namespace === SYSTEM_NAMESPACE ? this.system() : this.default();
  }
}

export { JobsDispatcherFactory, tenantIdForJob };
