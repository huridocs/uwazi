import { JobsDispatcherFactory } from '#api/core/infrastructure/factories/JobsDispatcherFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { ScheduleActivityLogArchivesJob } from './ScheduleActivityLogArchivesJob.js';

type Deps = {
  jobsDispatcher: JobsDispatcher;
};

/** Starts the daily chain: the job schedules its own next run from then on. */
class ScheduleActivityLogArchivesJobScheduler {
  constructor(private deps: Deps) {}

  static default(): ScheduleActivityLogArchivesJobScheduler {
    return new ScheduleActivityLogArchivesJobScheduler({
      jobsDispatcher: JobsDispatcherFactory.system(),
    });
  }

  async ensureScheduled(): Promise<void> {
    const existingJobs = await this.deps.jobsDispatcher.countByName(ScheduleActivityLogArchivesJob);
    if (existingJobs === 0) {
      await this.deps.jobsDispatcher.dispatch(ScheduleActivityLogArchivesJob, {});
    }
  }
}

export { ScheduleActivityLogArchivesJobScheduler };
