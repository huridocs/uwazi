import type { RefreshDatavizSnapshotJob } from '#api/dataviz.v2/application/jobs/RefreshDatavizSnapshotJob.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { rescheduleDatavizRefresh } from '../services/rescheduleDatavizRefresh.js';
import { isNonRetryableDatavizRefreshError } from './isNonRetryableDatavizRefreshError.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';

type Params = {
  datavizId: string;
  tenantName: string;
} & UwaziJobParams;

type JobDependencies = {
  job: RefreshDatavizSnapshotJob;
  datavizDS: DatavizDataSource;
  jobsDispatcher: JobsDispatcher;
};

class DatavizScheduledRefreshJobHandler extends UwaziJobHandler<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  private async rescheduleIfNeeded(params: Params) {
    await rescheduleDatavizRefresh({
      datavizId: params.datavizId,
      tenantName: params.tenantName,
      userId: params.userId,
      datavizDS: this.deps.datavizDS,
      jobsDispatcher: this.deps.jobsDispatcher,
    });
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params, _jobInfo?: JobInfo) {
    try {
      await this.deps.job.execute({ datavizId: params.datavizId });
    } catch (error) {
      if (isNonRetryableDatavizRefreshError(error)) {
        throw new NonRetryableJobError(error);
      }
      throw error;
    } finally {
      await this.rescheduleIfNeeded(params);
    }
  }
}

export { DatavizScheduledRefreshJobHandler };
