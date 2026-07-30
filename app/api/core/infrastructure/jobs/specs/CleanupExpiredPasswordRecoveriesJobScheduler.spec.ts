import { CleanupExpiredPasswordRecoveriesJob } from '../cleanupExpiredPasswordRecoveriesJob/CleanupExpiredPasswordRecoveriesJob.js';
import { CleanupExpiredPasswordRecoveriesJobScheduler } from '../cleanupExpiredPasswordRecoveriesJob/CleanupExpiredPasswordRecoveriesJobScheduler.js';

const makeScheduler = (existingJobs: number) => {
  const jobsDispatcher = {
    countByName: jest.fn().mockResolvedValue(existingJobs),
    dispatch: jest.fn(),
  } as any;
  const scheduler = new CleanupExpiredPasswordRecoveriesJobScheduler({ jobsDispatcher });
  return { scheduler, jobsDispatcher };
};

describe('CleanupExpiredPasswordRecoveriesJobScheduler', () => {
  it('should dispatch the job when none currently exists', async () => {
    const { scheduler, jobsDispatcher } = makeScheduler(0);

    await scheduler.ensureScheduled();

    expect(jobsDispatcher.countByName).toHaveBeenCalledWith(CleanupExpiredPasswordRecoveriesJob);
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(CleanupExpiredPasswordRecoveriesJob, {});
  });

  it('should not dispatch when a chain is already running', async () => {
    const { scheduler, jobsDispatcher } = makeScheduler(1);

    await scheduler.ensureScheduled();

    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
