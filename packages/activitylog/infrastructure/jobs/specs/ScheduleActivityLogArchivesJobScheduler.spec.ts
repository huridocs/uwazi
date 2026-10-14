import { ScheduleActivityLogArchivesJob } from '../ScheduleActivityLogArchivesJob.js';
import { ScheduleActivityLogArchivesJobScheduler } from '../ScheduleActivityLogArchivesJobScheduler.js';

const makeScheduler = (existingJobs: number) => {
  const jobsDispatcher = {
    countByName: jest.fn().mockResolvedValue(existingJobs),
    dispatch: jest.fn(),
  } as any;
  const scheduler = new ScheduleActivityLogArchivesJobScheduler({ jobsDispatcher });
  return { scheduler, jobsDispatcher };
};

describe('ScheduleActivityLogArchivesJobScheduler', () => {
  it('should dispatch the job when none currently exists', async () => {
    const { scheduler, jobsDispatcher } = makeScheduler(0);

    await scheduler.ensureScheduled();

    expect(jobsDispatcher.countByName).toHaveBeenCalledWith(ScheduleActivityLogArchivesJob);
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(ScheduleActivityLogArchivesJob, {});
  });

  it('should not dispatch when a chain is already running', async () => {
    const { scheduler, jobsDispatcher } = makeScheduler(1);

    await scheduler.ensureScheduled();

    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
