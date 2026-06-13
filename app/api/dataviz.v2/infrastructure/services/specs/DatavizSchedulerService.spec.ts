import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { User } from '#api/users.v2/model/User.js';
import { DatavizScheduledRefreshJobToken } from '#api/dataviz.v2/application/contracts/DatavizScheduledRefreshJobToken.js';
import { DatavizSchedulerService } from '../DatavizSchedulerService.js';

const baseDataviz = () =>
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

describe('DatavizSchedulerService', () => {
  it('should cancel pending jobs by datavizId', async () => {
    const cancelByParams = jest.fn();
    const service = new DatavizSchedulerService({
      jobsDispatcher: { cancelByParams, dispatch: jest.fn() } as any,
      tenantName: 'tenant1',
    });

    await service.cancelPending('dv1');
    expect(cancelByParams).toHaveBeenCalled();
  });

  it('should dispatch immediate job when scheduling', async () => {
    const dispatch = jest.fn();
    const cancelByParams = jest.fn();
    const service = new DatavizSchedulerService({
      jobsDispatcher: { cancelByParams, dispatch } as any,
      tenantName: 'tenant1',
    });

    const actor = User.createFrom({ _id: 'user1', role: 'admin' });
    await service.schedule(baseDataviz(), actor, true);

    expect(cancelByParams).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      DatavizScheduledRefreshJobToken,
      expect.objectContaining({ datavizId: 'dv1', tenantName: 'tenant1', userId: 'user1' })
    );
  });

  it('should dispatch with lockedUntil when not immediate', async () => {
    const dispatch = jest.fn();
    const service = new DatavizSchedulerService({
      jobsDispatcher: { cancelByParams: jest.fn(), dispatch } as any,
      tenantName: 'tenant1',
    });

    const actor = User.createFrom({ _id: 'user1', role: 'admin' });
    await service.schedule(baseDataviz(), actor, false);

    expect(dispatch).toHaveBeenCalledWith(
      DatavizScheduledRefreshJobToken,
      expect.objectContaining({ datavizId: 'dv1' }),
      expect.objectContaining({ lockedUntil: expect.any(Number) })
    );
  });
});
