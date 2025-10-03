import * as errorHelper from 'api/utils/handleError';
import Redis from 'redis';
import waitForExpect from 'wait-for-expect';
import { DistributedLoop } from '../DistributedLoop';

/* eslint-disable max-statements */
describe('DistributedLoopLock', () => {
  let finishTask;
  let task;
  let rejectTask;
  let pendingTasks;
  let testId;

  beforeEach(async () => {
    // Generate unique test ID to prevent lock name collisions in parallel tests
    testId = Math.random().toString(36).substring(7);
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
    // Resolve all pending tasks to prevent hanging
    await Promise.all(pendingTasks.map(pendingTask => pendingTask()));
    // Clear the array for next test
    pendingTasks = [];
  });

  async function sleepTime(time) {
    await new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  it('should run one task at a time', async () => {
    const nodeOne = new DistributedLoop(`my_locked_task_${testId}`, task, {
      delayTimeBetweenTasks: 0,
    });
    const nodeTwo = new DistributedLoop(`my_locked_task_${testId}`, task, {
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
    const nodeOne = new DistributedLoop(`my_long_locked_task_${testId}`, task, {
      retryDelay: 20,
      delayTimeBetweenTasks: 0,
    });
    const nodeTwo = new DistributedLoop(`my_long_locked_task_${testId}`, task, {
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
    const nodeOne = new DistributedLoop(`my_locked_task_${testId}`, task, {
      maxLockTime: 200,
      delayTimeBetweenTasks: 0,
    });
    const nodeTwo = new DistributedLoop(`my_locked_task_${testId}`, task, {
      maxLockTime: 200,
      delayTimeBetweenTasks: 0,
    });

    await nodeOne.start();

    // Wait for the first node to acquire the lock and start its task
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    const firstFinishTask = finishTask;
    await nodeTwo.start();

    // Wait for the second node to start (it should be waiting for the lock)
    // The second node will get the lock after the first node's lock expires
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    }, 15000); // Increased timeout for CI

    firstFinishTask();
    await nodeOne.stop();
    finishTask();
    await nodeTwo.stop();
  }, 20000); // Increased test timeout

  it('should continue executing the task if one task fails', async () => {
    jest.spyOn(errorHelper, 'handleError').mockImplementation(() => {});
    const nodeOne = new DistributedLoop(`my_locked_task_${testId}`, task, {
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
    const nodeOne = new DistributedLoop(`my_locked_task_${testId}`, task, {
      maxLockTime: 50,
      delayTimeBetweenTasks: 50,
      retryDelay: 20,
    });
    const nodeTwo = new DistributedLoop(`my_locked_task_${testId}`, task, {
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
    const sut = new DistributedLoop(`skip_delay_time_2_${testId}`, task, {
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
    const sut = new DistributedLoop(`skip_delay_time_2_${testId}`, task, {
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

    const lockName = `skip_delay_time_3_${testId}`;
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
