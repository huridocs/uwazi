import { TaskManagerFactory, TaskManager } from 'api/tasksmanager/TaskManager';
import { config } from 'api/config';
import { RedisServer } from '../RedisServer';
import Redis from 'redis';

describe('taskManager', () => {
  let taskManager: TaskManager;

  let queueName: string;
  let redisServer: RedisServer;
  let redis: Redis.RedisClient;

  beforeAll(async () => {});

  afterAll(async () => {});

  beforeEach(async () => {
    queueName = 'testQueue';
  });

  describe('startTask', () => {
    it('should add a task', async () => {
      redisServer = new RedisServer();
      await redisServer.start();

      redis = await Redis.createClient({ port: config.redis.port, host: config.redis.host });
      taskManager = await TaskManagerFactory.create(redis, queueName);
      await taskManager.startTask({});

      await redis.end(true);
      await redisServer.stop();
    });
  });
});
