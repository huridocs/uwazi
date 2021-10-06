import handleError from 'api/utils/handleError';
import waitForExpect from 'wait-for-expect';
import { RepeatWith } from '../RepeatWith';
import { RedisServer } from '../RedisServer';

jest.mock('api/utils/handleError.js', () => jest.fn());

/* eslint-disable max-statements */
describe('RepeatWithLock', () => {
  let finishTask;
  let task;
  let rejectTask;
  let redisServer;
  let pendingTasks;

  beforeAll(async () => {
    redisServer = new RedisServer();
    await redisServer.start();
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
    const nodeOne = new RepeatWith('my_locked_task', task);
    const nodeTwo = new RepeatWith('my_locked_task', task);
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
    const nodeOne = new RepeatWith('my_locked_task', task, 2000, 0, 20);
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
    const nodeOne = new RepeatWith('my_locked_task', task, 2000, 0, 20, 6371);
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
    const nodeOne = new RepeatWith('my_long_locked_task', task, 2000, 0, 20);
    const nodeTwo = new RepeatWith('my_long_locked_task', task, 2000, 0, 20);

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
    const nodeOne = new RepeatWith('my_locked_task', task, 50);
    const nodeTwo = new RepeatWith('my_locked_task', task, 50);

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
    const nodeOne = new RepeatWith('my_locked_task', task, 500);

    await nodeOne.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    const someError = { error: 'some error' };
    rejectTask(someError);
    await waitForExpect(async () => {
      expect(handleError).toHaveBeenLastCalledWith(someError);
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
    const nodeOne = new RepeatWith('my_locked_task', task, 50, 50, 20);
    const nodeTwo = new RepeatWith('my_locked_task', task, 50, 50, 20);

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
