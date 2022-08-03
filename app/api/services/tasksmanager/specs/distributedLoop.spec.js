import * as errorHelper from 'api/utils/handleError';
import waitForExpect from 'wait-for-expect';
import { DistributedLoop } from '../DistributedLoop';
import { RedisServer } from '../RedisServer';

/* eslint-disable max-statements */
describe('DistributedLoopLock', () => {
  let finishTask;
  let task;
  let rejectTask;
  let redisServer;
  let pendingTasks;

  beforeAll(async () => {
    redisServer = new RedisServer(6397);
    redisServer.start();
  });

  afterAll(async () => {
    await redisServer.stop();
  });

  beforeEach(async () => {
    pendingTasks = [];
    task = jasmine.createSpy('callbackone').and.callFake(
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
      port: 6397,
    });
    const nodeTwo = new DistributedLoop('my_locked_task', task, {
      delayTimeBetweenTasks: 0,
      port: 6397,
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

  it('should wait until the redis server is available to execute the task', async () => {
    await redisServer.stop();
    const nodeOne = new DistributedLoop('my_locked_task', task, {
      retryDelay: 20,
      delayTimeBetweenTasks: 0,
      port: 6397,
    });
    await nodeOne.start();

    await sleepTime(50);

    expect(task).toHaveBeenCalledTimes(0);

    await redisServer.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    finishTask();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    });

    finishTask();

    await nodeOne.stop();
  });

  it('should continue executing tasks after redis was unavailable for a while', async () => {
    const unstableRedisServer = new RedisServer(6371);
    await unstableRedisServer.start();
    const nodeOne = new DistributedLoop('my_locked_task', task, {
      retryDelay: 20,
      delayTimeBetweenTasks: 0,
      port: 6371,
    });
    await nodeOne.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    await unstableRedisServer.stop();

    finishTask();

    await sleepTime(50);
    expect(task).toHaveBeenCalledTimes(1);

    await unstableRedisServer.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    });

    finishTask();

    await nodeOne.stop();
    await unstableRedisServer.stop();
  });

  it('should handle when a lock fails for too many retries', async () => {
    const nodeOne = new DistributedLoop('my_long_locked_task', task, {
      retryDelay: 20,
      delayTimeBetweenTasks: 0,
      port: 6397,
    });
    const nodeTwo = new DistributedLoop('my_long_locked_task', task, {
      retryDelay: 20,
      delayTimeBetweenTasks: 0,
      port: 6397,
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
      port: 6397,
    });
    const nodeTwo = new DistributedLoop('my_locked_task', task, {
      maxLockTime: 50,
      delayTimeBetweenTasks: 0,
      port: 6397,
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
  });

  it('should continue executing the task if one task fails', async () => {
    jest.spyOn(errorHelper, 'handleError').mockImplementation(() => {});
    const nodeOne = new DistributedLoop('my_locked_task', task, {
      maxLockTime: 500,
      delayTimeBetweenTasks: 0,
      port: 6397,
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
      port: 6397,
    });
    const nodeTwo = new DistributedLoop('my_locked_task', task, {
      maxLockTime: 50,
      delayTimeBetweenTasks: 50,
      retryDelay: 20,
      port: 6397,
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
});
