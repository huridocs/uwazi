import { TaskManager } from 'api/tasksmanager/taskManager';
import RedisSMQ from "rsmq";

describe('taskManager', () => {
  describe('addTask', () => {
    const redis = require('redis-mock');
    const client = redis.createClient();
    const queue = new RedisSMQ({ client: client, ns: 'rsmq' });

    // jest.mock('redis', () => jest.requireActual('redis-mock'));

    const rsmq = jest.mock('rsmq');
    // const queue = rsmq.RedisSMQ();
    // const queue = {
    //   sendMessage: jest.fn(),
    // };

    const taskManager = new TaskManager(client);
    taskManager.addTask({ task: 1 });
    it('should add a task', async () => {
      expect().toHaveBeenCalled();
    });
  });
});
