import waitForExpect from 'wait-for-expect';
import { TaskManager, Service } from '#api/services/tasksmanager/TaskManager.js';
import { config } from '#api/config.js';
import * as handleError from '#api/utils/handleError.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { Redis } from '#api/infrastructure/Redis.js';
import { ExternalDummyService } from './ExternalDummyService.js';

describe('taskManager with deleteAfterProcessing', () => {
  let taskManager: TaskManager;
  let externalDummyService: ExternalDummyService;
  const processResults = jest.fn();

  const service: Service = {
    serviceName: 'DeleteAfterProcessing',
    processResults,
    processResultsMessageHiddenTime: 1,
    deleteAfterProcessing: true,
  };

  const pendingResults = async () =>
    (await taskManager.redisSMQ.getQueueAttributesAsync({ qname: taskManager.resultsQueue })).msgs;

  beforeAll(async () => {
    tenants.add({ name: 'tenant' });
    externalDummyService = new ExternalDummyService(1235, service.serviceName);
    await externalDummyService.start(`redis://${config.redis.host}:${config.redis.port}`);
    await Redis.connect();
    taskManager = new TaskManager(service);
    taskManager.subscribeToResults(100);
  });

  afterAll(async () => {
    await taskManager.stop();
    await externalDummyService.stop();
    await Redis.disconnect();
  });

  beforeEach(() => {
    jest.spyOn(handleError, 'handleError').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    processResults.mockReset();
  });

  it('should delete the message once it has been processed', async () => {
    processResults.mockResolvedValue(undefined);

    await externalDummyService.sendFinishedMessage({ task: 'segmentation', tenant: 'tenant' });

    await waitForExpect(async () => {
      expect(processResults).toHaveBeenCalledTimes(1);
      expect(await pendingResults()).toBe(0);
    });
  });

  it('should keep a message whose processing failed, so it is delivered again', async () => {
    processResults.mockRejectedValueOnce(new Error('dispatch failed')).mockResolvedValue(undefined);

    await externalDummyService.sendFinishedMessage({ task: 'segmentation', tenant: 'tenant' });

    await waitForExpect(async () => {
      expect(processResults).toHaveBeenCalledTimes(2);
      expect(await pendingResults()).toBe(0);
    }, 5000);
    expect(processResults.mock.calls[0]).toEqual(processResults.mock.calls[1]);
  });
});
