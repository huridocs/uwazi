import { ScheduleStaleOcrSweepJob } from '../ScheduleStaleOcrSweepJob.js';
import { ScheduleStaleOcrSweepJobScheduler } from '../ScheduleStaleOcrSweepJobScheduler.js';

const makeScheduler = (existingJobs: number) => {
  const jobsDispatcher = {
    countByName: jest.fn().mockResolvedValue(existingJobs),
    dispatch: jest.fn(),
  } as any;
  const scheduler = new ScheduleStaleOcrSweepJobScheduler({ jobsDispatcher });
  return { scheduler, jobsDispatcher };
};

describe('ScheduleStaleOcrSweepJobScheduler', () => {
  it('should dispatch the job when none currently exists', async () => {
    const { scheduler, jobsDispatcher } = makeScheduler(0);

    await scheduler.ensureScheduled();

    expect(jobsDispatcher.countByName).toHaveBeenCalledWith(ScheduleStaleOcrSweepJob);
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(ScheduleStaleOcrSweepJob, {});
  });

  it('should not dispatch when a chain is already running', async () => {
    const { scheduler, jobsDispatcher } = makeScheduler(1);

    await scheduler.ensureScheduled();

    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
