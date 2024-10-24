import * as errorHelper from 'api/utils/handleError';
import { createMockLogger } from 'api/log.v2/infrastructure/MockLogger';
import waitForExpect from 'wait-for-expect';
import { DistributedLoop } from '../DistributedLoop';

let finishTask;
let task;
let rejectTask;
let pendingTasks;
let mockLogger;

async function sleepTime(time) {
  await new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

const createSut = ({ lockName, options }) =>
  new DistributedLoop(
    lockName,
    task,
    {
      delayTimeBetweenTasks: 0,
      ...options,
    },
    mockLogger
  );

/* eslint-disable max-statements */
describe('DistributedLoopLock', () => {
  beforeEach(() => {
    pendingTasks = [];
    mockLogger = createMockLogger();
    task = jest.fn().mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          pendingTasks.push(resolve);
          rejectTask = reject;
          finishTask = resolve;
        })
    );
  });

  afterEach(async () => {
    await pendingTasks.map(pendingTask => pendingTask());
  });

  it('should run one task at a time', async () => {
    const nodeOne = createSut({ lockName: 'my_locked_task' });
    const nodeTwo = createSut({ lockName: 'my_locked_task' });

    await nodeOne.start();
    await nodeTwo.start();
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });
    finishTask();
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    });
    finishTask();
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(3);
    });
    finishTask();
    await nodeOne.stop();
    finishTask();
    await nodeTwo.stop();
  });

  it('should handle when a lock fails for too many retries', async () => {
    const nodeOne = createSut({
      lockName: 'my_long_locked_task',
      options: {
        retryDelay: 20,
        delayTimeBetweenTasks: 0,
      },
    });
    const nodeTwo = createSut({
      lockName: 'my_long_locked_task',
      options: {
        retryDelay: 20,
        delayTimeBetweenTasks: 0,
      },
    });

    await nodeOne.start();
    await nodeTwo.start();

    await sleepTime(250);

    expect(task).toHaveBeenCalledTimes(1);

    finishTask();
    await nodeOne.stop();
    finishTask();
    await nodeTwo.stop();
  });

  it('should handle when a node fails to unlock the lock', async () => {
    const nodeOne = createSut({
      lockName: 'my_locked_task',
      options: {
        maxLockTime: 50,
        delayTimeBetweenTasks: 0,
      },
    });
    const nodeTwo = createSut({
      lockName: 'my_locked_task',
      options: {
        maxLockTime: 50,
        delayTimeBetweenTasks: 0,
      },
    });

    await nodeOne.start();
    await sleepTime(10);
    const firstFinishTask = finishTask;
    await nodeTwo.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    });

    firstFinishTask();
    await nodeOne.stop();
    finishTask();
    await nodeTwo.stop();
  }, 10000);

  it('should continue executing the task if one task fails', async () => {
    jest.spyOn(errorHelper, 'handleError').mockImplementation(() => {});
    const nodeOne = createSut({
      lockName: 'my_locked_task',
      options: {
        maxLockTime: 500,
        delayTimeBetweenTasks: 0,
      },
    });

    await nodeOne.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    const someError = { error: 'some error' };
    rejectTask(someError);
    await waitForExpect(async () => {
      expect(errorHelper.handleError).toHaveBeenLastCalledWith(someError, { useContext: false });
    });

    finishTask();
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    });
    finishTask();
    await nodeOne.stop();
  });

  it('should add a delay between task executions', async () => {
    const nodeOne = createSut({
      lockName: 'my_locked_task',
      options: {
        maxLockTime: 50,
        delayTimeBetweenTasks: 50,
        retryDelay: 20,
      },
    });
    const nodeTwo = createSut({
      lockName: 'my_locked_task',
      options: {
        maxLockTime: 50,
        delayTimeBetweenTasks: 50,
        retryDelay: 20,
      },
    });

    await nodeOne.start();
    await nodeTwo.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    finishTask();
    await sleepTime(25);
    expect(task).toHaveBeenCalledTimes(1);

    finishTask();
    await nodeOne.stop();

    finishTask();
    await nodeTwo.stop();
  });

  it('should continue stop process if a task takes too long to stop', async () => {
    const sut = createSut({ lockName: 'stop_mocked_test', options: { stopTimeout: 0 } });

    sut.start();
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    await expect(sut.stop()).resolves.toBe(undefined);
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
