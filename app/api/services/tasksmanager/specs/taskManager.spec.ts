/* eslint-disable max-statements */
import waitForExpect from 'wait-for-expect';
import { TaskManager, Service } from 'api/services/tasksmanager/TaskManager';
import { config } from 'api/config';
import * as handleError from 'api/utils/handleError.js';
import { ExternalDummyService } from './ExternalDummyService';

describe('taskManager', () => {
  let taskManager: TaskManager | undefined;

  let service: Service;
  let externalDummyService: ExternalDummyService;

  beforeAll(async () => {
    const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
    service = {
      serviceName: 'KonzNGaboHellKitchen',
      processResults: jest.fn(),
      processResultsMessageHiddenTime: 1,
    };

    externalDummyService = new ExternalDummyService(1234, service.serviceName);
    await externalDummyService.start(redisUrl);

    taskManager = new TaskManager(service);
    taskManager.subscribeToResults();

    await new Promise(resolve => {
      setTimeout(resolve, 100);
    }); // wait for redis to be ready
  });

  afterAll(async () => {
    await externalDummyService.stop();
    await taskManager?.stop();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startTask', () => {
    it('should add a task', async () => {
      await taskManager?.startTask({
        task: 'CheeseBurger',
        tenant: 'Rafa',
      });
      const message = await externalDummyService.readFirstTaskMessage();
      expect(message).toBe('{"task":"CheeseBurger","tenant":"Rafa"}');
    });

    describe('when multiple tasks are added', () => {
      it('services get them in order', async () => {
        await taskManager?.startTask({
          task: 'CheeseBurger',
          tenant: 'Joan',
        });

        await taskManager?.startTask({
          task: 'Fries',
          tenant: 'Joan',
        });

        await taskManager?.startTask({
          task: 'Ribs',
          tenant: 'Fede',
        });

        let message = await externalDummyService.readFirstTaskMessage();
        expect(message).toBe('{"task":"CheeseBurger","tenant":"Joan"}');

        message = await externalDummyService.readFirstTaskMessage();
        expect(message).toBe('{"task":"Fries","tenant":"Joan"}');

        message = await externalDummyService.readFirstTaskMessage();
        expect(message).toBe('{"task":"Ribs","tenant":"Fede"}');
      });
    });
  });

  describe('count tasks', () => {
    it('should count the pending tasks', async () => {
      await taskManager?.startTask({
        task: 'CheeseBurger',
        tenant: 'Rafa',
      });

      await taskManager?.startTask({
        task: 'Fries',
        tenant: 'Joan',
      });

      await taskManager?.startTask({
        task: 'Ribs',
        tenant: 'Fede',
      });

      const pendingTasks = await taskManager?.countPendingTasks();
      expect(pendingTasks).toBe(3);
    });
  });

  describe('when the task finishes', () => {
    it('should call process results once and delete the result message', async () => {
      const task = {
        task: 'Tofu',
        tenant: 'Gabo',
        data_url: 'http://localhost:1234/results',
      };

      await externalDummyService.sendFinishedMessage(task);

      await waitForExpect(async () => {
        expect(service.processResults).toHaveBeenCalledWith(task);
      });

      const queueAttributes = await taskManager?.redisSMQ!.getQueueAttributesAsync({
        qname: taskManager.resultsQueue,
      });

      expect(queueAttributes!.msgs).toBe(0);
    });

    it('should handle errors during results processing and delete the message', async () => {
      const task = {
        task: 'Tofu',
        tenant: 'Gabo',
        data_url: 'http://localhost:1234/results',
      };

      await externalDummyService.sendFinishedMessage(task);
      service.processResults = jest.fn().mockRejectedValue('error');
      jest.spyOn(handleError, 'handleError').mockImplementation(() => {});

      await waitForExpect(async () => {
        expect(service.processResults).toHaveBeenCalledWith(task);
      });

      expect(handleError.handleError).toHaveBeenCalledWith('error', { useContext: false });
      const queueAttributes = await taskManager?.redisSMQ!.getQueueAttributesAsync({
        qname: taskManager.resultsQueue,
      });
      expect(queueAttributes!.msgs).toBe(0);
    });
  });

  describe('when redis server is not available', () => {
    it('taskManager should fail to start task', async () => {
      const task = { task: 'Spagueti', tenant: 'Konz' };

      taskManager!.redisClient.end(true);

      try {
        await taskManager?.startTask(task);
        fail('It should throw');
      } catch (e) {
        expect(e).toEqual(Error('Redis is not connected'));
      }
    });
  });
});
