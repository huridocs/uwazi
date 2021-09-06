import { TaskManagerFactory, TaskManager } from 'api/tasksmanager/TaskManager';

import { RedisServer } from '../RedisServer';
import { DummyService } from './DummyService';
import Redis from 'redis';

describe('taskManager', () => {
  let taskManager: TaskManager;

  let queueName: string;
  let redisServer: RedisServer;
  let client: Redis.RedisClient;
  let externalDummyService: DummyService;

  beforeAll(async () => {
    queueName = 'KonzNGaboHellKitchen';
    redisServer = new RedisServer();
    await redisServer.start();
    client = await Redis.createClient('redis://localhost:6379');
    taskManager = await TaskManagerFactory.create(client, queueName);

    externalDummyService = new DummyService(1234);
    await externalDummyService.start(client);
  });

  afterAll(async () => {
    await externalDummyService.stop();
    await client.end(true);
    await redisServer.stop();
  });

  describe('startTask', () => {
    it('should add a task', async () => {
      await taskManager.startTask({
        task: 'CheeseBurger',
        tenant: 'Rafa',
      });

      await externalDummyService.read();

      expect(externalDummyService.currentTask).toBe('{"task":"CheeseBurger","tenant":"Rafa"}');
    });

    describe('when multiple tasks are added', () => {
      it('services get them in order', async () => {
        await taskManager.startTask({
          task: 'CheeseBurger',
          tenant: 'Joan',
        });

        await taskManager.startTask({
          task: 'Fries',
          tenant: 'Joan',
        });

        await taskManager.startTask({
          task: 'Ribs',
          tenant: 'Fede',
        });

        let message = await externalDummyService.read();
        expect(message).toBe('{"task":"CheeseBurger","tenant":"Joan"}');

        message = await externalDummyService.read();
        expect(message).toBe('{"task":"Fries","tenant":"Joan"}');

        message = await externalDummyService.read();
        expect(message).toBe('{"task":"Ribs","tenant":"Fede"}');
      });
    });

    describe('sending materials', () => {
      it('should send materials to the service', async () => {
        // const task = { task: 'doit', tenant: 'test' };
        // const materials = { data: '{"someData": "someValue"}' };
        // await taskManager.startTask(task, materials);
        // await externalDummyService.read();
        // expect(externalDummyService.materials[0]).toEqual(materials);
      });
    });
  });
});
