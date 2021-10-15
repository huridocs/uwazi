/* eslint-disable max-statements */
import fs from 'fs';
import waitForExpect from 'wait-for-expect';
import { TaskManager, Service } from 'api/services/tasksmanager/TaskManager';
import { RedisServer } from '../RedisServer';
import { ExternalDummyService } from './ExternalDummyService';
import { config } from 'api/config';

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
      processRessultsMessageHiddenTime: 1,
    };
    redisServer = new RedisServer(port);
    await redisServer.start();

    externalDummyService = new ExternalDummyService(1234, service.serviceName);
    await externalDummyService.start(redisUrl);

    taskManager = new TaskManager(service);

    await new Promise(resolve => setTimeout(resolve, 100)); // wait for redis to be ready
  });

  afterAll(async () => {
    await taskManager?.stop();
    await externalDummyService.stop();
    await redisServer.stop();
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
        results_url: 'http://localhost:1234/results',
      };

      await externalDummyService.sendFinishedMessage(task);

      await waitForExpect(async () => {
        expect(service.processResults).toHaveBeenCalledWith(task);
      });

      await new Promise(resolve => setTimeout(resolve, 1001)); // wait for another check for results
      expect(service.processResults).toHaveBeenCalledTimes(1);
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
        await new Promise(resolve => setTimeout(resolve, 200)); // wait for redis to connect
        await taskManager?.startTask(task);

        const message = await externalDummyService.readFirstTaskMessage();
        expect(message).toBe('{"task":"Ceviche","tenant":"Mercy"}');
      });

      it('should read pending messages', async () => {
        const task = {
          task: 'Ceviche',
          tenant: 'Mercy',
          results_url: 'http://localhost:1234/results',
        };

        externalDummyService.setResults({
          results: 'Ceviche',
        });
        await redisServer.stop();
        await externalDummyService.sendFinishedMessage(task);

        expect(service.processResults).not.toHaveBeenCalled();

        await redisServer.start();

        await waitForExpect(async () => {
          expect(service.processResults).toHaveBeenCalledWith(task);
        });
      });
    });
  });
});
