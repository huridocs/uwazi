import waitForExpect from 'wait-for-expect';
import { RepeatWithLock } from '../RepeatWithLock';
import { RedisServer } from '../RedisServer';

describe('RepeatWithLock', () => {
  let finishTask;
  let task;
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
      return new Promise(resolve => {
        finishTask = () => {
          resolve();
          console.log('end');

        };
      });
    });
  });

  it('should run the task one at a time', async () => {
    await redisServer.start();

    const nodeOne = new RepeatWithLock('my_locked_task', task);
    const nodeTwo = new RepeatWithLock('my_locked_task', task);
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
    const nodeOne = new RepeatWithLock('my_locked_task', task);
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

    const nodeOne = new RepeatWithLock('my_locked_task', task);
    await nodeOne.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(1);
    });

    await redisServer.stop();

    finishTask();

    await new Promise(resolve => {
      setTimeout(resolve, 200);
    });

    expect(task).toHaveBeenCalledTimes(1);

    await redisServer.start();

    await waitForExpect(async () => {
      expect(task).toHaveBeenCalledTimes(2);
    });

    finishTask();

    await nodeOne.stop();

    await redisServer.stop();
  });

  it('redlock', async () => {
    await redisServer.start();

    const nodeOne = new RepeatWithLock('my_locked_task', task);
    const nodeTwo = new RepeatWithLock('my_locked_task', task);

    await nodeOne.start();
    await nodeTwo.start();

    await new Promise(resolve => {
      setTimeout(resolve, 3000);
    });

    finishTask();
    await nodeOne.stop();
    await new Promise(resolve => {
      setTimeout(resolve, 500);
    });
    finishTask();
    await nodeTwo.stop();

    await redisServer.stop();
  });
});
