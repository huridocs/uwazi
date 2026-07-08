import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UnregisteredJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import {
  JobRegistry,
  SyncJobsDispatcher,
} from '#api/core/libs/queue/infrastructure/SyncJobsDispatcher.js';

class ExampleJob implements Dispatchable {
  public static calls: { params: any; jobInfo?: any }[] = [];

  async handleDispatch(_heartbeat: () => Promise<void>, params: any, jobInfo?: any) {
    ExampleJob.calls.push({ params, jobInfo });
  }
}

class ChainJob implements Dispatchable {
  public static dispatcher: SyncJobsDispatcher | null = null;

  public static calls: any[] = [];

  async handleDispatch(_heartbeat: () => Promise<void>, params: any) {
    ChainJob.calls.push(params);
    if (params.next && ChainJob.dispatcher) {
      await ChainJob.dispatcher.dispatch(ExampleJob, params.next);
    }
  }
}

class ManyJob implements Dispatchable {
  public static calls: any[] = [];

  async handleDispatch(_heartbeat: () => Promise<void>, params: any) {
    ManyJob.calls.push(params);
  }
}

describe('SyncJobsDispatcher', () => {
  let registry: JobRegistry;
  let dispatcher: SyncJobsDispatcher;

  beforeEach(() => {
    ExampleJob.calls = [];
    ChainJob.calls = [];
    ManyJob.calls = [];

    dispatcher = new SyncJobsDispatcher({});
    registry = {
      ExampleJob: async () => new ExampleJob(),
      ChainJob: async () => {
        const job = new ChainJob();
        ChainJob.dispatcher = dispatcher;
        return job as unknown as Dispatchable;
      },
      ManyJob: async () => new ManyJob(),
    };
    dispatcher = new SyncJobsDispatcher(registry);
  });

  it('should execute a registered job inline with system namespace', async () => {
    await dispatcher.dispatch(ExampleJob, { value: 1 });

    expect(ExampleJob.calls).toHaveLength(1);
    expect(ExampleJob.calls[0].params).toEqual({ value: 1 });
    expect(ExampleJob.calls[0].jobInfo?.namespace).toBe('system');
  });

  it('should throw UnregisteredJobError for unknown job names', async () => {
    class UnknownJob implements Dispatchable {
      // eslint-disable-next-line class-methods-use-this
      async handleDispatch(_heartbeat: () => Promise<void>, _params: any) {}
    }

    await expect(dispatcher.dispatch(UnknownJob, {})).rejects.toThrow(
      new UnregisteredJobError(UnknownJob.name)
    );
  });

  it('should execute chained jobs inline', async () => {
    await dispatcher.dispatch(ChainJob, { current: 1, next: { value: 2 } });

    expect(ChainJob.calls).toEqual([{ current: 1, next: { value: 2 } }]);
    expect(ExampleJob.calls).toEqual([
      { params: { value: 2 }, jobInfo: { retryCount: 0, maxRetries: 0, namespace: 'system' } },
    ]);
  });

  it('should execute dispatchMany jobs sequentially', async () => {
    await dispatcher.dispatchMany(dispatch => {
      dispatch(ManyJob, { a: 1 });
      dispatch(ManyJob, { a: 2 });
      dispatch(ManyJob, { a: 3 });
    });

    expect(ManyJob.calls).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it('should throw UnregisteredJobError when dispatchMany references an unknown job', async () => {
    class UnknownJob implements Dispatchable {
      // eslint-disable-next-line class-methods-use-this
      async handleDispatch(_heartbeat: () => Promise<void>, _params: any) {}
    }

    await expect(
      dispatcher.dispatchMany(dispatch => {
        dispatch(UnknownJob, {});
      })
    ).rejects.toThrow(new UnregisteredJobError(UnknownJob.name));
  });

  it('deleteByParams should be a no-op', async () => {
    await expect(dispatcher.deleteByParams(ExampleJob, {})).resolves.toBeUndefined();
  });

  it('cancelByParams should be a no-op', async () => {
    await expect(dispatcher.cancelByParams(ExampleJob, {})).resolves.toBeUndefined();
  });
});
