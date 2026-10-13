import pg from 'pg';
import { config } from '#api/config.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import {
  DefaultDispatcher,
  DefaultPostgresQueueAdapter,
} from '#api/core/libs/queue/configuration/factories.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { tenants } from '#api/tenants/index.js';
import { ArchiveActivityOverflow } from '../../application/ArchiveActivityOverflow.js';
import { ScheduleActivityLogArchivesJob } from '../jobs/ScheduleActivityLogArchivesJob.js';

type Options = { pool?: pg.Pool; maxRows?: number; chunkRows?: number };

/**
 * The job reads every tenant's rows, so it counts on the admin pool. Only tenants on Postgres are
 * archived, and their jobs go to the Postgres queue, where a `postgresCore` tenant's jobs run.
 */
class ScheduleActivityLogArchivesJobFactory {
  static default(options: Options = {}): ScheduleActivityLogArchivesJob {
    const maxRows = options.maxRows ?? config.activityLog.maxRows;
    const chunkRows = options.chunkRows ?? ArchiveActivityOverflow.CHUNK_ROWS;

    return new ScheduleActivityLogArchivesJob({
      pool: options.pool ?? PostgresDB.adminPool(),
      jobsDispatcher: ExecutionContext.jobsDispatcher,
      dispatcherFor: ScheduleActivityLogArchivesJobFactory.postgresQueueOf,
      tenantNames: tenants.getTenantsForFeatureFlag('postgresCore').map(tenant => tenant.name),
      dueFrom: maxRows + chunkRows,
    });
  }

  private static postgresQueueOf(this: void, tenantName: string): JobsDispatcher {
    const transactionManager = new PostgresTransactionManager(
      PostgresDB.knex,
      tenantName,
      LoggerFactory.systemLogger()
    );

    return DefaultDispatcher(
      tenantName,
      transactionManager,
      DefaultPostgresQueueAdapter(transactionManager)
    );
  }
}

export { ScheduleActivityLogArchivesJobFactory };
