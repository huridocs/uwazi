import type { RefreshDatavizSnapshotJob } from '#api/dataviz.v2/application/jobs/RefreshDatavizSnapshotJob.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { rescheduleDatavizRefresh } from '../services/rescheduleDatavizRefresh.js';
import { isNonRetryableDatavizRefreshError } from './isNonRetryableDatavizRefreshError.js';

type Params = {
  datavizId: string;
} & UserAwareDispatchableParams;

type JobDependencies = {
  job: RefreshDatavizSnapshotJob;
  datavizDS: DatavizDataSource;
  jobsDispatcher: JobsDispatcher;
};

class DatavizScheduledRefreshJobHandler extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  private async rescheduleIfNeeded() {
    await rescheduleDatavizRefresh({
      datavizId: this.params.datavizId,
      tenantName: this.tenantName,
      userId: this.userId,
      datavizDS: this.deps.datavizDS,
      jobsDispatcher: this.deps.jobsDispatcher,
    });
  }

  protected async handle(_heartbeat: HeartbeatCallback, _jobInfo?: JobInfo) {
    try {
      await this.deps.job.execute({ datavizId: this.params.datavizId });
    } catch (error) {
      if (isNonRetryableDatavizRefreshError(error)) {
        throw new NonRetryableJobError(error);
      }
      throw error;
    } finally {
      await this.rescheduleIfNeeded();
    }
  }
}

export { DatavizScheduledRefreshJobHandler };
