import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { DatavizScheduledRefreshJobToken } from '#api/dataviz.v2/application/contracts/DatavizScheduledRefreshJobToken.js';
import { rescheduleDatavizRefresh } from '../rescheduleDatavizRefresh.js';

const scheduledDataviz = () =>
  new Dataviz({
    id: 'dv1',
    name: 'Scheduled',
    query: {
      sources: [{ templateId: 't1' }],
      dimensions: [{ property: 'color', propertyType: 'select' }],
      measures: [{ aggregation: 'count' }],
    },
    chart: { type: 'pie' },
    appearance: { colorMode: 'from_data' },
    refresh: { refreshMode: 'snapshot_scheduled', schedule: 'daily', scheduleTime: '02:00' },
  });

describe('rescheduleDatavizRefresh', () => {
  it('should enqueue the next scheduled refresh when the dataviz still exists', async () => {
    const dispatch = jest.fn();
    const datavizDS = {
      getById: jest.fn().mockResolvedValue({
        isError: () => false,
        getDataOrThrow: () => scheduledDataviz(),
      }),
    };

    await rescheduleDatavizRefresh({
      datavizId: 'dv1',
      tenantName: 'tenant1',
      userId: 'user1',
      datavizDS: datavizDS as any,
      jobsDispatcher: { dispatch } as any,
    });

    expect(dispatch).toHaveBeenCalledWith(
      DatavizScheduledRefreshJobToken,
      expect.objectContaining({ datavizId: 'dv1', tenantName: 'tenant1', userId: 'user1' }),
      expect.objectContaining({ lockedUntil: expect.any(Number) })
    );
  });

  it('should not enqueue when the dataviz was deleted', async () => {
    const dispatch = jest.fn();
    const datavizDS = {
      getById: jest.fn().mockResolvedValue({ isError: () => true }),
    };

    await rescheduleDatavizRefresh({
      datavizId: 'dv1',
      tenantName: 'tenant1',
      userId: 'user1',
      datavizDS: datavizDS as any,
      jobsDispatcher: { dispatch } as any,
    });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
