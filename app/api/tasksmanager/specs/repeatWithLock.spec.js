import { RepeatWithLock } from '../RepeatWithLock';
import { RedisServer } from '../RedisServer';

describe('RepeatWithLock', () => {
  let finishTask;
  let task;
  let redisServer;
  let nodeOne;
  let nodeTwo;

  const waitForLockDistribution = async () => {
    if (finishTask) {
      finishTask();
    }
    return new Promise(r => setTimeout(r, 100));
  };

  beforeAll(async () => {
    redisServer = new RedisServer();
    await redisServer.start();
  });

  afterAll(async () => {
    await redisServer.stop();
  });

  beforeEach(async () => {
    task = jasmine.createSpy('callbackone').and.callFake(
      () =>
        new Promise(resolve => {
          finishTask = () => {
            resolve();
          };
        })
    );

    nodeOne = new RepeatWithLock('my_locked_task', task);
    nodeTwo = new RepeatWithLock('my_locked_task', task);
    await nodeOne.start();
    await nodeTwo.start();
  });

  it('should run the task one at a time', async () => {
    await waitForLockDistribution();
    expect(task).toHaveBeenCalledTimes(1);

    await waitForLockDistribution();
    expect(task).toHaveBeenCalledTimes(2);

    await waitForLockDistribution();
    expect(task).toHaveBeenCalledTimes(3);
    finishTask();

    await Promise.all([nodeOne.stop(), nodeTwo.stop()]);

    finishTask();
  });
});
