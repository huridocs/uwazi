import { TaskManager } from 'api/tasksmanager/taskManager';
import RedisSMQ from 'rsmq';
import { RedisServer } from '../RedisServer';
import Redis from 'ioredis';

describe('taskManager', () => {
  let taskManager: TaskManager;

  let rsmq: RedisSMQ;
  let queueName: string;
  let redisServer: RedisServer;
  let redis: Redis;

  beforeAll(async () => {});

  afterAll(async () => {});

  beforeEach(async () => {
    queueName = 'testQueue';
  });

  describe('addTask', () => {
    it('should add a task', async () => {
      redisServer = new RedisServer();
      await redisServer.start();

      redis = new Redis();
      rsmq = await new RedisSMQ({ client: redis });
      // taskManager = new TaskManager(rsmq, queueName);
      // taskManager.addTask('hello');

      // expect(rsmq.sendMessage).toHaveBeenCalledWith({ qname: queueName, message: 'hello' });
      await redisServer.stop();
    });
  });
});
