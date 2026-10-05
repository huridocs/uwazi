import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
  Params,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

type Deps = {
  tenantNames: () => string[];
  /** Requests the stale sweep in one tenant. */
  sweep: (tenantName: string) => Promise<void>;
  jobsDispatcher: JobsDispatcher;
};

/**
 * Hourly, in the system namespace: asks every tenant to sweep its stale OCR records. A tenant
 * that fails does not hold back the others; the run fails after all were tried. It always queues
 * its next run — on success, and on the final failed attempt — so one bad hour does not end the
 * chain.
 */
@PrivilegedJob()
class ScheduleStaleOcrSweepJob implements Dispatchable {
  constructor(private deps: Deps) {}

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    _params?: Params,
    jobInfo?: JobInfo
  ): Promise<void> {
    let succeeded = false;
    try {
      await this.sweepAll();
      succeeded = true;
    } finally {
      const isFinalAttempt = !jobInfo || jobInfo.retryCount >= jobInfo.maxRetries;

      if (succeeded || isFinalAttempt) {
        await this.deps.jobsDispatcher.dispatch(
          ScheduleStaleOcrSweepJob,
          {},
          { lockedUntil: Date.now() + ONE_HOUR_IN_MS }
        );
      }
    }
  }

  private async sweepAll() {
    const results = await Promise.allSettled(
      this.deps.tenantNames().map(async tenantName => this.deps.sweep(tenantName))
    );
    const failed = results.find(result => result.status === 'rejected');
    if (failed) {
      throw (failed as PromiseRejectedResult).reason;
    }
  }
}

export { ScheduleStaleOcrSweepJob };
