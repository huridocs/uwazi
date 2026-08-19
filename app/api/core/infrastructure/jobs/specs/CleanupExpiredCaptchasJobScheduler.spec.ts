import { CleanupExpiredCaptchasJob } from '../cleanupExpiredCaptchasJob/CleanupExpiredCaptchasJob.js';
import { CleanupExpiredCaptchasJobScheduler } from '../cleanupExpiredCaptchasJob/CleanupExpiredCaptchasJobScheduler.js';

const makeScheduler = (existingJobs: number) => {
  const jobsDispatcher = {
    countByName: jest.fn().mockResolvedValue(existingJobs),
    dispatch: jest.fn(),
  } as any;
  const scheduler = new CleanupExpiredCaptchasJobScheduler({ jobsDispatcher });
  return { scheduler, jobsDispatcher };
};

describe('CleanupExpiredCaptchasJobScheduler', () => {
  it('should dispatch the job when none currently exists', async () => {
    const { scheduler, jobsDispatcher } = makeScheduler(0);

    await scheduler.ensureScheduled();

    expect(jobsDispatcher.countByName).toHaveBeenCalledWith(CleanupExpiredCaptchasJob);
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(CleanupExpiredCaptchasJob, {});
  });

  it('should not dispatch when a chain is already running', async () => {
    const { scheduler, jobsDispatcher } = makeScheduler(1);

    await scheduler.ensureScheduled();

    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
