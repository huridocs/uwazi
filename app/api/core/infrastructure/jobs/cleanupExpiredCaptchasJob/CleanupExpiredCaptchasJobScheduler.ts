import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { CleanupExpiredCaptchasJob } from './CleanupExpiredCaptchasJob.js';

type Deps = {
  jobsDispatcher: JobsDispatcher;
};

class CleanupExpiredCaptchasJobScheduler {
  constructor(private deps: Deps) {}

  static default(): CleanupExpiredCaptchasJobScheduler {
    return new CleanupExpiredCaptchasJobScheduler({
      jobsDispatcher: DefaultDispatcher(
        'system',
        TransactionManagerFactory.createForSharedDataBase()
      ),
    });
  }

  async ensureScheduled(): Promise<void> {
    const existingJobs = await this.deps.jobsDispatcher.countByName(CleanupExpiredCaptchasJob);
    if (existingJobs === 0) {
      await this.deps.jobsDispatcher.dispatch(CleanupExpiredCaptchasJob, {});
    }
  }
}

export { CleanupExpiredCaptchasJobScheduler };
