import { ScheduleStaleOcrSweepJob } from '../ScheduleStaleOcrSweepJob.js';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const noopHeartbeat = async () => undefined;

const makeJob = (sweep: jest.Mock = jest.fn().mockResolvedValue(undefined)) => {
  const jobsDispatcher = { dispatch: jest.fn() } as any;
  const job = new ScheduleStaleOcrSweepJob({
    tenantNames: () => ['tenant-a', 'tenant-b'],
    sweep,
    jobsDispatcher,
  });
  return { job, jobsDispatcher, sweep };
};

describe('ScheduleStaleOcrSweepJob', () => {
  it('should request a sweep in every tenant', async () => {
    const { job, sweep } = makeJob();

    await job.handleDispatch(noopHeartbeat);

    expect(sweep.mock.calls.map(([tenant]) => tenant)).toEqual(['tenant-a', 'tenant-b']);
  });

  it('should re-dispatch itself in an hour after a successful run', async () => {
    const { job, jobsDispatcher } = makeJob();

    const before = Date.now();
    await job.handleDispatch(noopHeartbeat);
    const after = Date.now();

    expect(jobsDispatcher.dispatch).toHaveBeenCalledTimes(1);
    const [dispatchedClass, params, options] = jobsDispatcher.dispatch.mock.calls[0];
    expect(dispatchedClass).toBe(ScheduleStaleOcrSweepJob);
    expect(params).toEqual({});
    expect(options.lockedUntil).toBeGreaterThanOrEqual(before + ONE_HOUR_IN_MS);
    expect(options.lockedUntil).toBeLessThanOrEqual(after + ONE_HOUR_IN_MS);
  });

  it('should still sweep the other tenants when one fails, then fail the run', async () => {
    const sweep = jest
      .fn()
      .mockRejectedValueOnce(new Error('tenant down'))
      .mockResolvedValue(undefined);
    const { job } = makeJob(sweep);

    await expect(job.handleDispatch(noopHeartbeat)).rejects.toThrow('tenant down');

    expect(sweep).toHaveBeenCalledTimes(2);
  });

  it('should still re-dispatch itself even when a sweep fails', async () => {
    const { job, jobsDispatcher } = makeJob(jest.fn().mockRejectedValue(new Error('down')));

    await expect(job.handleDispatch(noopHeartbeat)).rejects.toThrow('down');

    expect(jobsDispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it('should NOT re-dispatch when a failed attempt still has retries left', async () => {
    const { job, jobsDispatcher } = makeJob(jest.fn().mockRejectedValue(new Error('down')));

    await expect(
      job.handleDispatch(noopHeartbeat, {}, { retryCount: 1, maxRetries: 5, namespace: 'system' })
    ).rejects.toThrow('down');

    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should re-dispatch when the final retry attempt still fails, so the chain survives', async () => {
    const { job, jobsDispatcher } = makeJob(jest.fn().mockRejectedValue(new Error('down')));

    await expect(
      job.handleDispatch(noopHeartbeat, {}, { retryCount: 5, maxRetries: 5, namespace: 'system' })
    ).rejects.toThrow('down');

    expect(jobsDispatcher.dispatch).toHaveBeenCalledTimes(1);
  });
});
