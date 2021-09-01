import { TaskManager } from 'api/tasksmanager/taskManager';
import RedisSMQ from 'rsmq';

describe('taskManager', () => {
  let taskManager: TaskManager;

  let rsmq: Partial<RedisSMQ>;
  let queueName: string;

  beforeEach(() => {
    queueName = 'testQueue';
    rsmq = {
      createQueue: jest.fn(),
      sendMessage: jest.fn(),
    };
    taskManager = new TaskManager(rsmq as RedisSMQ, queueName);
  });

  describe('addTask', () => {
    it('should add a task', async () => {
      taskManager.addTask('hello');
      expect(rsmq.sendMessage).toHaveBeenCalledWith({ qname: queueName, message: 'hello' });
    });
  });
});
