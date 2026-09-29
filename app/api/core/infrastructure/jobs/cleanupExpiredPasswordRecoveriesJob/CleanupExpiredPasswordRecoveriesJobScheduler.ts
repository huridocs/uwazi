import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { JobsDispatcherFactory } from '#api/core/infrastructure/factories/JobsDispatcherFactory.js';
import { CleanupExpiredPasswordRecoveriesJob } from './CleanupExpiredPasswordRecoveriesJob.js';

type Deps = {
  jobsDispatcher: JobsDispatcher;
};

class CleanupExpiredPasswordRecoveriesJobScheduler {
  constructor(private deps: Deps) {}

  static default(): CleanupExpiredPasswordRecoveriesJobScheduler {
    return new CleanupExpiredPasswordRecoveriesJobScheduler({
      jobsDispatcher: JobsDispatcherFactory.system(),
    });
  }

  async ensureScheduled(): Promise<void> {
    const existingJobs = await this.deps.jobsDispatcher.countByName(
      CleanupExpiredPasswordRecoveriesJob
    );
    if (existingJobs === 0) {
      await this.deps.jobsDispatcher.dispatch(CleanupExpiredPasswordRecoveriesJob, {});
    }
  }
}

export { CleanupExpiredPasswordRecoveriesJobScheduler };
