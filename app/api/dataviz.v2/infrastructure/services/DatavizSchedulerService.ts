import type { DatavizScheduler } from '#api/dataviz.v2/application/contracts/DatavizScheduler.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { User } from '#api/users.v2/model/User.js';
import { computeNextLockedUntil } from '#shared/dataviz/computeNextLockedUntil.js';
import { DatavizScheduledRefreshJobHandlerToken } from '#api/dataviz.v2/application/contracts/DatavizScheduledRefreshJobHandlerToken.js';
import { cancelPendingDatavizRefreshJobs } from './cancelPendingDatavizRefreshJobs.js';

type Deps = {
  jobsDispatcher: JobsDispatcher;
  tenantName: string;
};

class DatavizSchedulerService implements DatavizScheduler {
  constructor(private deps: Deps) {}

  async cancelPending(datavizId: string): Promise<void> {
    await cancelPendingDatavizRefreshJobs(this.deps.jobsDispatcher, datavizId);
  }

  async schedule(dataviz: Dataviz, actor: User, runImmediately = true): Promise<void> {
    if (!dataviz.isScheduled) {
      return;
    }

    await this.cancelPending(dataviz.id);

    const params = {
      datavizId: dataviz.id,
      tenantName: this.deps.tenantName,
      userId: actor._id.toString(),
    };

    if (runImmediately) {
      await this.deps.jobsDispatcher.dispatch(DatavizScheduledRefreshJobHandlerToken, params);
      return;
    }

    const lockedUntil = computeNextLockedUntil(dataviz.refresh);
    await this.deps.jobsDispatcher.dispatch(DatavizScheduledRefreshJobHandlerToken, params, {
      lockedUntil,
    });
  }
}

export { DatavizSchedulerService };
