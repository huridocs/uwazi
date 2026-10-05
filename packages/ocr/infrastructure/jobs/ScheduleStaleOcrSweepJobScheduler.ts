import { JobsDispatcherFactory } from '#api/core/infrastructure/factories/JobsDispatcherFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { ScheduleStaleOcrSweepJob } from './ScheduleStaleOcrSweepJob.js';

type Deps = {
  jobsDispatcher: JobsDispatcher;
};

class ScheduleStaleOcrSweepJobScheduler {
  constructor(private deps: Deps) {}

  static default(): ScheduleStaleOcrSweepJobScheduler {
    return new ScheduleStaleOcrSweepJobScheduler({
      jobsDispatcher: JobsDispatcherFactory.system(),
    });
  }

  async ensureScheduled(): Promise<void> {
    const existingJobs = await this.deps.jobsDispatcher.countByName(ScheduleStaleOcrSweepJob);
    if (existingJobs === 0) {
      await this.deps.jobsDispatcher.dispatch(ScheduleStaleOcrSweepJob, {});
    }
  }
}

export { ScheduleStaleOcrSweepJobScheduler };
