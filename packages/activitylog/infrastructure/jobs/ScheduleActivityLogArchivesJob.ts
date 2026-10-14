import pg from 'pg';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
  Params,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { ArchiveActivityOverflowJobHandler } from './ArchiveActivityOverflowJobHandler.js';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

type Deps = {
  pool: pg.Pool;
  jobsDispatcher: JobsDispatcher;
  dispatcherFor: (tenantName: string) => JobsDispatcher;
  tenantNames: string[];
  dueFrom: number;
};

/**
 * Runs once a day for the whole system: counts every tenant's entries in one query and sends an
 * archive job to each tenant that is due. Tenants under the limit cost nothing more than that.
 */
@PrivilegedJob()
class ScheduleActivityLogArchivesJob implements Dispatchable {
  constructor(private deps: Deps) {}

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    _params?: Params,
    jobInfo?: JobInfo
  ): Promise<void> {
    let succeeded = false;
    try {
      await Promise.all(
        (await this.dueTenants()).map(async tenantName =>
          this.deps.dispatcherFor(tenantName).dispatch(ArchiveActivityOverflowJobHandler, {})
        )
      );
      succeeded = true;
    } finally {
      const isFinalAttempt = !jobInfo || jobInfo.retryCount >= jobInfo.maxRetries;

      if (succeeded || isFinalAttempt) {
        await this.deps.jobsDispatcher.dispatch(
          ScheduleActivityLogArchivesJob,
          {},
          { lockedUntil: Date.now() + ONE_DAY_IN_MS }
        );
      }
    }
  }

  private async dueTenants(): Promise<string[]> {
    const { rows } = await this.deps.pool.query<{ tenant_id: string }>(
      `SELECT "tenant_id" FROM activitylogs
       WHERE "tenant_id" = ANY($1)
       GROUP BY "tenant_id"
       HAVING count(*) >= $2`,
      [this.deps.tenantNames, this.deps.dueFrom]
    );

    return rows.map(row => row.tenant_id);
  }
}

export { ScheduleActivityLogArchivesJob };
