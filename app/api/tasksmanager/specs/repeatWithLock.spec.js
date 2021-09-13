// const handleErrorSpy = jest.mock('api/utils/handleError.js', () => {});
// import handleError from 'api/utils/handleError';
import handleError from 'api/utils/handleError';
import waitForExpect from 'wait-for-expect';
import { RepeatWith } from '../RepeatWith';
import { RedisServer } from '../RedisServer';

jest.mock('api/utils/handleError.js', () => jest.fn());

describe('RepeatWithLock', () => {
  let finishTask;
  let task;
  let rejectTask;
  let redisServer;

  beforeAll(async () => {
    redisServer = new RedisServer();
  });

  afterAll(async () => {
    if (redisServer.connect) {
      await redisServer.end();
    }
  });

  beforeEach(async () => {
    task = jasmine.createSpy('callbackone').and.callFake(() => {
      console.log('start');
      return new Promise((resolve, reject) => {
        rejectTask = reject;
        finishTask = () => {
          resolve();
          console.log('end');
        };
      });
    });
  });

  async function sleepTime(time) {
    await new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  it('should run the task one at a time', async () => {
    await redisServer.start();

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
    await nodeTwo.stop();

    await redisServer.stop();
  });

  it('should execute task when the redis server is available', async () => {
    const nodeOne = new RepeatWith('my_locked_task', task);
    await nodeOne.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(0);
    });

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

    await redisServer.stop();
  });

  it('should continue executing tasks after redis was unavailable for a while', async () => {
    await redisServer.start();

    const nodeOne = new RepeatWith('my_locked_task', task);
    await nodeOne.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    await redisServer.stop();

    finishTask();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    await redisServer.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    });

    finishTask();

    await nodeOne.stop();

    await redisServer.stop();
  });

  it('should handle when a lock fails for too many times', async () => {
    await redisServer.start();

    const nodeOne = new RepeatWith('my_locked_task', task);
    const nodeTwo = new RepeatWith('my_locked_task', task);

    await nodeOne.start();
    await nodeTwo.start();

    await new Promise(resolve => {
      setTimeout(resolve, 2100);
    });

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    finishTask();
    await nodeOne.stop();
    finishTask();
    await nodeTwo.stop();

    await redisServer.stop();
  });

  it('should handle when a node fails to unlock the lock', async () => {
    await redisServer.start();

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

    await redisServer.stop();
  });

  it('should continue executing the task if one task fails', async () => {
    await redisServer.start();

    const nodeOne = new RepeatWith('my_locked_task', task, 500);

    await nodeOne.start();
    console.log(rejectTask);
    await sleepTime(25);
    console.log(rejectTask);
    const someError = { error: 'some error' };
    rejectTask(someError);
    await waitForExpect(async () => {
      expect(handleError).toHaveBeenLastCalledWith(someError);
    });

    finishTask();
    await sleepTime(10);
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    });
    finishTask();
    await nodeOne.stop();
    await redisServer.stop();
  });

  it('should add a delay between task executions', async () => {
    await redisServer.start();

    const nodeOne = new RepeatWith('my_locked_task', task, 10, 250);
    const nodeTwo = new RepeatWith('my_locked_task', task, 10, 250);

    await nodeOne.start();
    await nodeTwo.start();

    await sleepTime(50);
    finishTask();
    await sleepTime(50);
    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    finishTask();
    await nodeOne.stop();

    finishTask();
    await nodeTwo.stop();

    await redisServer.stop();
  });
});
