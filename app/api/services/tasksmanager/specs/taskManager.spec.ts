/* eslint-disable max-statements */
import waitForExpect from 'wait-for-expect';
import { TaskManager, Service } from 'api/services/tasksmanager/TaskManager';
import { config } from 'api/config';
import * as handleError from 'api/utils/handleError.js';
import { ExternalDummyService } from './ExternalDummyService';
import { RedisServer } from '../RedisServer';

describe('taskManager', () => {
  let taskManager: TaskManager | undefined;

  let service: Service;
  let redisServer: RedisServer;
  let externalDummyService: ExternalDummyService;

  beforeAll(async () => {
    const port = 6378;
    config.redis.port = port;

    const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
    service = {
      serviceName: 'KonzNGaboHellKitchen',
      processResults: jest.fn(),
      processResultsMessageHiddenTime: 1,
    };
    redisServer = new RedisServer(port);
    redisServer.start();

    externalDummyService = new ExternalDummyService(1234, service.serviceName);
    await externalDummyService.start(redisUrl);

    taskManager = new TaskManager(service);
    taskManager.subscribeToResults();

    await new Promise(resolve => {
      setTimeout(resolve, 100);
    }); // wait for redis to be ready
  });

  afterAll(async () => {
    await redisServer.stop();
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
      jest.spyOn(handleError, 'handleError');

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
      await redisServer.stop();
      const task = { task: 'Spagueti', tenant: 'Konz' };

      try {
        await taskManager?.startTask(task);
        fail('It should throw');
      } catch (e) {
        expect(e).toEqual(Error('Redis is not connected'));
      }

      await redisServer.start();
    });

    describe('and redis comes back', () => {
      it('should send tasks again', async () => {
        await externalDummyService.resetQueue();
        await redisServer.stop();

        const task = { task: 'Ceviche', tenant: 'Mercy' };

        try {
          await taskManager?.startTask(task);
          fail('It should throw');
        } catch (e) {
          expect(e).toEqual(Error('Redis is not connected'));
        }

        await redisServer.start();

        await waitForExpect(async () => {
          expect(taskManager?.redisClient.connected).toBe(true);
        });
        await taskManager?.startTask(task);

        const message = await externalDummyService.readFirstTaskMessage();
        expect(message).toBe('{"task":"Ceviche","tenant":"Mercy"}');
      });

      it('should read pending messages', async () => {
        await taskManager?.stop();
        const task = {
          task: 'Ceviche',
          tenant: 'Mercy',
          results_url: 'http://localhost:1234/results',
        };
        externalDummyService.setResults({
          results: 'Ceviche',
        });

        await externalDummyService.sendFinishedMessage(task);

        await redisServer.stop();

        taskManager = new TaskManager(service);
        taskManager.subscribeToResults();
        expect(service.processResults).not.toHaveBeenCalled();

        redisServer.start();

        await waitForExpect(async () => {
          expect(service.processResults).toHaveBeenCalledWith(task);
        });
      });
    });
  });
});
