/* eslint-disable max-statements */
import fs from 'fs';
import waitForExpect from 'wait-for-expect';
import { TaskManager, Service } from 'api/services/tasksmanager/TaskManager';
import { RedisServer } from '../RedisServer';
import { ExternalDummyService } from './ExternalDummyService';

describe('taskManager', () => {
  let taskManager: TaskManager | undefined;

  let service: Service;
  let redisServer: RedisServer;
  let externalDummyService: ExternalDummyService;

  beforeAll(async () => {
    const port = 6378;
    service = {
      serviceName: 'KonzNGaboHellKitchen',
      dataUrl: 'http://localhost:1234/data',
      filesUrl: 'http://localhost:1234/files',
      resultsUrl: 'http://localhost:1234/results',
      redisUrl: `redis://localhost:${port}`,
      processResults: jest.fn(),
    };
    redisServer = new RedisServer(port);
    await redisServer.start();

    externalDummyService = new ExternalDummyService(1234, service.serviceName);
    await externalDummyService.start(service.redisUrl);

    taskManager = new TaskManager(service);
    taskManager.subscribeToResults();

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
      const file = fs.readFileSync('app/api/services/tasksmanager/specs/blank.pdf');

      await taskManager?.sendFile(file, 'blank1.pdf');
      await taskManager?.sendFile(file, 'blank2.pdf');
      await taskManager?.sendFile(file, 'blank3.pdf');

      expect(externalDummyService.files.length).toEqual(3);
      expect(externalDummyService.files[0]).toEqual(file);
      expect(externalDummyService.filesNames[0]).toEqual('blank1.pdf');
      expect(externalDummyService.files[1]).toEqual(file);
      expect(externalDummyService.filesNames[1]).toEqual('blank2.pdf');
      expect(externalDummyService.files[2]).toEqual(file);
      expect(externalDummyService.filesNames[2]).toEqual('blank3.pdf');
    });
  });

  describe('when the task finishes', () => {
    it('should get the results', async () => {
      const expectedResults = { results: 'Paella' };

      await taskManager?.stop();
      taskManager = new TaskManager(service);
      taskManager.subscribeToResults();

      externalDummyService.setResults(expectedResults);
      const task = { task: 'Tofu', tenant: 'Gabo' };
      await externalDummyService.sendFinishedMessage(task);

      await waitForExpect(async () => {
        expect(service.processResults).toHaveBeenCalledWith(expectedResults);
      });
    });
  });

  describe('when redis server is not available', () => {
    it('taskManager should fail to start task', async () => {
      await redisServer.stop();
      const task = { task: 'Spagueti', tenant: 'Kon' };

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
        const task = { task: 'Ceviche', tenant: 'Mercy' };

        await taskManager?.stop();
        externalDummyService.setResults({ results: 'Paella' });
        await externalDummyService.sendFinishedMessage(task);

        expect(service.processResults).not.toHaveBeenCalled();
        await redisServer.stop();

        taskManager?.start();
        taskManager?.subscribeToResults();

        await redisServer.start();

        await waitForExpect(async () => {
          expect(service.processResults).toHaveBeenCalledWith({
            results: 'Paella',
          });
        });
      });
    });
  });
});
