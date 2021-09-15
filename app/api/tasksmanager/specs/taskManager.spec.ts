import fs from 'fs';

import { TaskManager, Service } from 'api/tasksmanager/taskManager';

import Redis from 'redis';
import RedisSMQ from 'rsmq';
import { RedisServer } from '../RedisServer';
import { ExternalDummyService } from './ExternalDummyService';

describe('taskManager', () => {
  let taskManager: TaskManager | undefined;

  let service: Service;
  let redisServer: RedisServer;
  let client: Redis.RedisClient;
  let externalDummyService: ExternalDummyService;

  beforeAll(async () => {
    service = {
      serviceName: 'KonzNGaboHellKitchen',
      dataUrl: 'http://localhost:1234/data',
      filesUrl: 'http://localhost:1234/files',
      resultsUrl: 'http://localhost:1234/results',
      redisUrl: 'redis://localhost:6379',
    };

    redisServer = new RedisServer();
    await redisServer.start();

    externalDummyService = new ExternalDummyService(1234);
    await externalDummyService.start(service.redisUrl);

    taskManager = new TaskManager(service);
    await taskManager.start();
  });

  afterAll(async () => {
    await taskManager?.stop();
    await externalDummyService.stop();
    await client.end(true);
    await redisServer.stop();
  });

  describe('startTask', () => {
    it('should add a task', async () => {
      await taskManager?.startTask({
        task: 'CheeseBurger',
        tenant: 'Rafa',
      });

      await externalDummyService.read();

      expect(externalDummyService.currentTask).toBe('{"task":"CheeseBurger","tenant":"Rafa"}');
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

        let message = await externalDummyService.read();
        expect(message).toBe('{"task":"CheeseBurger","tenant":"Joan"}');

        message = await externalDummyService.read();
        expect(message).toBe('{"task":"Fries","tenant":"Joan"}');

        message = await externalDummyService.read();
        expect(message).toBe('{"task":"Ribs","tenant":"Fede"}');
      });
    });
  });

  describe('sending materials', () => {
    it('should send materials to the service', async () => {
      const materials1 = { someData: 3 };
      const materials2 = { someData: 2 };
      const materials3 = { someData: 3 };
      await taskManager?.sendJSON(materials1);
      await taskManager?.sendJSON(materials2);
      await taskManager?.sendJSON(materials3);

      expect(externalDummyService.materials.length).toEqual(3);
      expect(externalDummyService.materials[0]).toEqual(materials1);
      expect(externalDummyService.materials[1]).toEqual(materials2);
      expect(externalDummyService.materials[2]).toEqual(materials3);
    });

    it('should send files to the service', async () => {
      const file = fs.readFileSync('app/api/tasksmanager/specs/blank.pdf');

      await taskManager?.sendFile(file);
      await taskManager?.sendFile(file);
      await taskManager?.sendFile(file);

      expect(externalDummyService.files.length).toEqual(3);
      expect(externalDummyService.files[0]).toEqual(file);
      expect(externalDummyService.files[1]).toEqual(file);
      expect(externalDummyService.files[2]).toEqual(file);
    });
  });

  describe('when the task finishes', () => {
    it('should get the results', async done => {
      const expectedResults = { results: 'Paella' };
      const expectFunction = (results: object) => {
        expect(results).toEqual(expectedResults);
        done();
      };
      service.processResults = expectFunction;
      await taskManager?.stop();
      taskManager = new TaskManager(service);
      await taskManager.start();

      const task = { task: 'make_food', tenant: 'test' };
      externalDummyService.setResults(expectedResults);
      await externalDummyService.sendFinishedMessage(task);
    });
  });
});

it('taskManager should fail to start task if redis is unavailable', async () => {
  const service = {
    serviceName: 'KonzNGaboHellKitchen',
    dataUrl: 'http://localhost:1234/data',
    filesUrl: 'http://localhost:1234/files',
    resultsUrl: 'http://localhost:1234/results',
    redisUrl: 'redis://localhost:6379',
  };

  const taskManager = new TaskManager(service);

  await expect(taskManager.start()).rejects.toThrow('I should fail');
});
