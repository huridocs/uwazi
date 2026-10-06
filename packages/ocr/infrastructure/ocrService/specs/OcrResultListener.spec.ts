import waitForExpect from 'wait-for-expect';
import { config } from '#api/config.js';
import { Redis } from '#api/infrastructure/Redis.js';
import { ExternalDummyService } from '#api/services/tasksmanager/specs/ExternalDummyService.js';
import { tenants } from '#api/tenants/tenantContext.js';
import * as handleError from '#api/utils/handleError.js';
import { IdempotencyKey } from '../../../domain/IdempotencyKey.js';
import { OcrResultListener } from '../OcrResultListener.js';

// Its own queue family: other specs reset the `ocr` queues on the shared Redis.
const SERVICE_NAME = 'ocr_listener_spec';

describe('OcrResultListener', () => {
  let service: ExternalDummyService;
  let listener: OcrResultListener;
  const saveResult = jest.fn();

  const pendingResults = async () =>
    (await service.rsmq.getQueueAttributesAsync({ qname: `development_${SERVICE_NAME}_results` }))
      .msgs;

  beforeAll(async () => {
    tenants.add({ name: 'tenant' });
    service = new ExternalDummyService(1240, SERVICE_NAME);
    await service.start(`redis://${config.redis.host}:${config.redis.port}`);
    await Redis.connect();
    listener = new OcrResultListener({
      saveResult,
      messageHiddenTimeSeconds: 1,
      serviceName: SERVICE_NAME,
    });
    listener.start(100);
  });

  afterAll(async () => {
    await listener.stop();
    await service.stop();
    await Redis.disconnect();
  });

  beforeEach(() => {
    jest.spyOn(handleError, 'handleError').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    saveResult.mockReset();
  });

  it('should hand the translated outcome over, then drop the message', async () => {
    saveResult.mockResolvedValue(undefined);

    await service.sendFinishedMessage({
      tenant: 'tenant',
      task: 'ocr',
      params: { filename: 'document.pdf', metadata: { key: 'rec1:1' } },
      success: true,
      file_url: 'http://service/file',
    });

    await waitForExpect(async () => {
      expect(saveResult).toHaveBeenCalledWith({
        key: IdempotencyKey.of('rec1', 1),
        filename: 'document.pdf',
        succeeded: true,
        handle: { fileUrl: 'http://service/file' },
      });
      expect(await pendingResults()).toBe(0);
    });
  });

  it('should report and drop a message it cannot understand, without handing it over', async () => {
    await service.sendFinishedMessage({ tenant: 'tenant', task: 'ocr', success: true });

    await waitForExpect(async () => {
      expect(await pendingResults()).toBe(0);
    });
    expect(saveResult).not.toHaveBeenCalled();
    expect(handleError.handleError).toHaveBeenCalled();
  });

  it('should keep a message whose hand-over failed, so it is delivered again', async () => {
    saveResult.mockRejectedValueOnce(new Error('queue down')).mockResolvedValue(undefined);

    await service.sendFinishedMessage({
      tenant: 'tenant',
      task: 'ocr',
      params: { filename: 'document.pdf' },
      success: false,
      error_message: 'The PDF could not be found',
    });

    await waitForExpect(async () => {
      expect(saveResult).toHaveBeenCalledTimes(2);
      expect(await pendingResults()).toBe(0);
    }, 5000);
  });
});
