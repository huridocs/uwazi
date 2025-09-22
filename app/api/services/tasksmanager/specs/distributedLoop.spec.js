import * as errorHelper from '../utils/handleError.js';
import Redis from 'redis';
import waitForExpect from 'wait-for-expect';
import { DistributedLoop } from '../DistributedLoop';

/* eslint-disable max-statements */
describe('DistributedLoopLock', () => {
  let finishTask;
  let task;
  let rejectTask;
  let pendingTasks;

  beforeEach(async () => {
    pendingTasks = [];
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

  async function sleepTime(time) {
    await new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  it('should run one task at a time', async () => {
    const nodeOne = new DistributedLoop('my_locked_task', task, {
      delayTimeBetweenTasks: 0,
    });
    const nodeTwo = new DistributedLoop('my_locked_task', task, {
      delayTimeBetweenTasks: 0,
    });
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
    const nodeOne = new DistributedLoop('my_long_locked_task', task, {
      retryDelay: 20,
      delayTimeBetweenTasks: 0,
    });
    const nodeTwo = new DistributedLoop('my_long_locked_task', task, {
      retryDelay: 20,
      delayTimeBetweenTasks: 0,
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
    const nodeOne = new DistributedLoop('my_locked_task', task, {
      maxLockTime: 50,
      delayTimeBetweenTasks: 0,
    });
    const nodeTwo = new DistributedLoop('my_locked_task', task, {
      maxLockTime: 50,
      delayTimeBetweenTasks: 0,
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
    const nodeOne = new DistributedLoop('my_locked_task', task, {
      maxLockTime: 500,
      delayTimeBetweenTasks: 0,
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

  // eslint-disable-next-line max-statements
  it('should add a delay between task executions', async () => {
    const nodeOne = new DistributedLoop('my_locked_task', task, {
      maxLockTime: 50,
      delayTimeBetweenTasks: 50,
      retryDelay: 20,
    });
    const nodeTwo = new DistributedLoop('my_locked_task', task, {
      maxLockTime: 50,
      delayTimeBetweenTasks: 50,
      retryDelay: 20,
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

  it('when stop method is executed after task finish, it should skip delay time between tasks', async () => {
    const sut = new DistributedLoop('skip_delay_time_2', task, {
      delayTimeBetweenTasks: 100_000,
    });

    const waitBetweenTasksSpy = jest.spyOn(sut, 'waitBetweenTasks');

    sut.start();
    await waitForExpect(() => expect(task).toHaveBeenCalledTimes(1));

    finishTask();
    await sleepTime(25);
    const stopPromise = sut.stop();

    expect(waitBetweenTasksSpy).toHaveBeenCalled();
    await expect(stopPromise).resolves.toBeUndefined();
  });

  test('when stop method is executed before a task finish, it should skip delay time between tasks', async () => {
    const sut = new DistributedLoop('skip_delay_time_2', task, {
      delayTimeBetweenTasks: 100_000,
    });

    const waitBetweenTasksSpy = jest.spyOn(sut, 'waitBetweenTasks');

    sut.start();

    await waitForExpect(() => expect(task).toHaveBeenCalledTimes(1));

    const stopPromise = sut.stop();
    finishTask();
    await sleepTime(25);

    expect(waitBetweenTasksSpy).not.toHaveBeenCalled();
    await expect(stopPromise).resolves.toBeUndefined();
  });

  test('when stop method is executed, it should unlock the Distributed Loop', async () => {
    const connectionConfig = { port: 6379, host: 'localhost' };
    const connection = Redis.createClient(
      `redis://${connectionConfig.host}:${connectionConfig.port}`
    );
    const get = key =>
      new Promise((resolve, reject) => {
        connection.get(key, (error, data) => {
          if (error) reject(error);
          resolve(data);
        });
      });

    const lockName = 'skip_delay_time_3';
    const sut = new DistributedLoop(lockName, task, {
      delayTimeBetweenTasks: 100_000,
    });

    sut.start();
    await waitForExpect(() => expect(task).toHaveBeenCalledTimes(1));

    const stopPromise = sut.stop();

    finishTask();
    await sleepTime(25);
    await expect(stopPromise).resolves.toBeUndefined();

    const result = await get(`locks:${lockName}`);
    expect(result).toBeFalsy();
    connection.quit();
  });
});
