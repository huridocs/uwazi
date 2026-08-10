import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import {
  DatavizInvalidQueryError,
  DatavizNotFoundError,
  DatavizQueryTimeoutError,
} from '#api/dataviz.v2/domain/errors.js';
import { rescheduleDatavizRefresh } from '#api/dataviz.v2/infrastructure/services/rescheduleDatavizRefresh.js';
import { DatavizScheduledRefreshJobHandler } from '../DatavizScheduledRefreshJobHandler.js';

jest.mock('#api/dataviz.v2/infrastructure/services/rescheduleDatavizRefresh.js', () => ({
  rescheduleDatavizRefresh: jest.fn(),
}));

const testParams = { datavizId: 'dv1', tenantName: 'tenant1', userId: 'user1' };

const createJobHandler = (job: { execute: jest.Mock }) => {
  const handler = new DatavizScheduledRefreshJobHandler({
    job: job as any,
    datavizDS: {} as any,
    jobsDispatcher: {} as any,
  });

  return handler;
};

describe('DatavizScheduledRefreshJobHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reschedule the next run when refresh fails with a retryable error', async () => {
    const job = {
      execute: jest.fn().mockRejectedValue(new Error('refresh failed')),
    };

    const handler = createJobHandler(job);

    await expect((handler as any).handle(null, testParams)).rejects.toThrow('refresh failed');
    expect(rescheduleDatavizRefresh).toHaveBeenCalledWith(
      expect.objectContaining({
        datavizId: 'dv1',
        tenantName: 'tenant1',
        userId: 'user1',
      })
    );
  });

  it('should throw NonRetryableJobError when the dataviz was deleted', async () => {
    const notFound = new DatavizNotFoundError('dv1');
    const job = {
      execute: jest.fn().mockRejectedValue(notFound),
    };

    const handler = createJobHandler(job);

    await expect((handler as any).handle(null, testParams)).rejects.toThrow(
      new NonRetryableJobError(notFound)
    );
    expect(rescheduleDatavizRefresh).toHaveBeenCalled();
  });

  it('should throw NonRetryableJobError when the query configuration is invalid', async () => {
    const invalidQuery = new DatavizInvalidQueryError(
      'Manual data visualizations cannot be refreshed'
    );
    const job = {
      execute: jest.fn().mockRejectedValue(invalidQuery),
    };

    const handler = createJobHandler(job);

    await expect((handler as any).handle(null, testParams)).rejects.toThrow(
      new NonRetryableJobError(invalidQuery)
    );
    expect(rescheduleDatavizRefresh).toHaveBeenCalled();
  });

  it('should allow retries when the query times out', async () => {
    const timeout = new DatavizQueryTimeoutError();
    const job = {
      execute: jest.fn().mockRejectedValue(timeout),
    };

    const handler = createJobHandler(job);

    await expect((handler as any).handle(null, testParams)).rejects.toThrow(timeout);
    expect(rescheduleDatavizRefresh).toHaveBeenCalled();
  });
});
