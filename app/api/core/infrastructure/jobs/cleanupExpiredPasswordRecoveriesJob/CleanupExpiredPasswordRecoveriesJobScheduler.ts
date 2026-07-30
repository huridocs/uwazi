import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { CleanupExpiredPasswordRecoveriesJob } from './CleanupExpiredPasswordRecoveriesJob.js';

type Deps = {
  jobsDispatcher: JobsDispatcher;
};

class CleanupExpiredPasswordRecoveriesJobScheduler {
  constructor(private deps: Deps) {}

  static default(): CleanupExpiredPasswordRecoveriesJobScheduler {
    return new CleanupExpiredPasswordRecoveriesJobScheduler({
      jobsDispatcher: DefaultDispatcher(
        'system',
        TransactionManagerFactory.createForSharedDataBase()
      ),
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
