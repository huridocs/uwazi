jest.mock('#api/dataviz.v2/infrastructure/services/rescheduleDatavizRefresh.js', () => ({
  rescheduleDatavizRefresh: jest.fn(),
}));

jest.mock('#api/core/libs/queue/application/contracts/UserAwareDispatchable.js', () => {
  class MockUserAwareDispatchable {
    protected params: any;
    protected tenantName = '';
    protected userId = '';
    protected async handle() {}
  }
  return { UserAwareDispatchable: MockUserAwareDispatchable };
});

import { rescheduleDatavizRefresh } from '#api/dataviz.v2/infrastructure/services/rescheduleDatavizRefresh.js';
import { DatavizScheduledRefreshJob } from '../DatavizScheduledRefreshJob.js';

describe('DatavizScheduledRefreshJob', () => {
  it('should reschedule the next run when refresh fails', async () => {
    const refreshUseCase = {
      execute: jest.fn().mockRejectedValue(new Error('refresh failed')),
    };

    const job = new DatavizScheduledRefreshJob({
      refreshUseCase: refreshUseCase as any,
      datavizDS: {} as any,
      jobsDispatcher: {} as any,
    });

    (job as any).params = { datavizId: 'dv1', tenantName: 'tenant1', userId: 'user1' };
    (job as any).tenantName = 'tenant1';
    (job as any).userId = 'user1';

    await expect((job as any).handle()).rejects.toThrow('refresh failed');
    expect(rescheduleDatavizRefresh).toHaveBeenCalledWith(
      expect.objectContaining({
        datavizId: 'dv1',
        tenantName: 'tenant1',
        userId: 'user1',
      })
    );
  });
});
