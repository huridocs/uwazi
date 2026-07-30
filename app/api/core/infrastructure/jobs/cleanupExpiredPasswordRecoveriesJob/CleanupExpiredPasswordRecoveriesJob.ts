import pg from 'pg';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
  Params,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

type Deps = {
  pool: pg.Pool;
  jobsDispatcher: JobsDispatcher;
};

class CleanupExpiredPasswordRecoveriesJob implements Dispatchable {
  constructor(private deps: Deps) {}

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    _params?: Params,
    jobInfo?: JobInfo
  ): Promise<void> {
    let succeeded = false;
    try {
      await this.deps.pool.query('DELETE FROM password_recoveries WHERE "expiresAt" < now()');
      succeeded = true;
    } finally {
      const isFinalAttempt = !jobInfo || jobInfo.retryCount >= jobInfo.maxRetries;

      if (succeeded || isFinalAttempt) {
        await this.deps.jobsDispatcher.dispatch(
          CleanupExpiredPasswordRecoveriesJob,
          {},
          { lockedUntil: Date.now() + ONE_DAY_IN_MS }
        );
      }
    }
  }
}

export { CleanupExpiredPasswordRecoveriesJob };
