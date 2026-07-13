/**
 * @jest-environment jsdom
 */
import backend from 'fetch-mock';
import { ApiClientEventBus, ApiError, createApiClient } from '#shared/apiClient/index.js';
import {
  createAuthPolicy,
  createLoadingPolicy,
  createNotificationPolicy,
} from '#V2/api/policies.js';
import { buildSaveWithFilesPayload, saveWithFiles } from '#V2/api/entities/save/index.js';

const mockPostMultipart = jest.fn();

const createMockXMLHttpRequest = () => {
  class MockXMLHttpRequest {
    upload = { addEventListener: jest.fn() };

    status = 200;

    statusText = 'OK';

    responseText = '{"entity":{"_id":"1","title":"Entity"}}';

    onload: (() => void) | null = null;

    open = jest.fn();

    setRequestHeader = jest.fn();

    send = jest.fn(() => {
      this.onload?.();
    });

    // eslint-disable-next-line class-methods-use-this
    getAllResponseHeaders() {
      return 'Content-Type: application/json\r\n';
    }
  }

  return MockXMLHttpRequest;
};

const wirePolicyTestHarness = () => {
  const eventBus = new ApiClientEventBus();
  const start = jest.fn();
  const end = jest.fn();
  const notify = jest.fn();
  const redirectToLogin = jest.fn();

  createLoadingPolicy(eventBus, { start, end });
  createNotificationPolicy(eventBus, notify);
  createAuthPolicy(eventBus, redirectToLogin);

  return { eventBus, start, end, notify, redirectToLogin };
};

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    postMultipart: (...args: unknown[]) => mockPostMultipart(...args),
  },
}));

describe('entity save stack integration', () => {
  const baseUrl = 'http://localhost:3000/api/';

  beforeEach(() => {
    backend.restore();
    mockPostMultipart.mockReset();
    backend.get(`${baseUrl}items`, { status: 200, body: { rows: [{ _id: '1' }] } });
    backend.get(`${baseUrl}missing`, {
      status: 404,
      body: { error: 'not found', requestId: 'abc' },
    });
  });

  describe('apiClient transport', () => {
    it('returns tuple on success and ApiError on HTTP failure', async () => {
      const client = createApiClient({ baseUrl, retry: false });
      const [data, error] = await client.getJson<{ rows: { _id: string }[] }>('items');
      const [, missingError] = await client.getJson('missing');

      expect(error).toBeUndefined();
      expect(data?.rows[0]._id).toBe('1');
      expect(missingError).toBeInstanceOf(ApiError);
      expect(missingError?.status).toBe(404);
    });

    it('keeps per-request Content-Language over client locale', async () => {
      const client = createApiClient({ baseUrl, language: 'es', retry: false });
      await client.getJson('items', undefined, { headers: { 'Content-Language': 'en' } });
      expect(backend.lastOptions()?.headers?.['Content-Language']).toBe('en');
    });

    it('retries idempotent GET on 503', async () => {
      let calls = 0;
      backend.get(`${baseUrl}flaky`, () => {
        calls += 1;
        return calls === 1
          ? { status: 503, body: { error: 'unavailable' } }
          : { status: 200, body: { ok: true } };
      });

      const client = createApiClient({
        baseUrl,
        retryPolicy: { baseDelayMs: 1, maxDelayMs: 1, maxAttempts: 3 },
      });
      const [data, error] = await client.getJson<{ ok: boolean }>('flaky');

      expect(error).toBeUndefined();
      expect(data?.ok).toBe(true);
      expect(calls).toBe(2);
    });

    it('emits lifecycle events for multipart uploads', async () => {
      global.FormData = jest.fn(() => ({ append: jest.fn() })) as unknown as typeof FormData;
      global.XMLHttpRequest = createMockXMLHttpRequest() as unknown as typeof XMLHttpRequest;

      const events: string[] = [];
      const eventBus = new ApiClientEventBus();
      eventBus.subscribe(event => events.push(event.type));

      const client = createApiClient({ baseUrl, eventBus, retry: false });
      await client.postMultipart('entities', { fields: [{ name: 'entity', value: '{}' }] });

      expect(events).toContain('request:start');
      expect(events).toContain('request:success');
    });
  });

  describe('policies', () => {
    it('drives loading, notification, and auth from request:error events', () => {
      const { eventBus, start, end, notify, redirectToLogin } = wirePolicyTestHarness();

      eventBus.emit({ type: 'request:start', id: '1', method: 'POST', path: 'entities' });
      expect(start).toHaveBeenCalledTimes(1);

      eventBus.emit({
        type: 'request:error',
        id: '1',
        error: new ApiError('Bad request', { kind: 'http', status: 400, detail: 'Invalid' }),
      });
      expect(notify).toHaveBeenCalledWith('error', expect.any(String), undefined, 'Invalid');
      expect(end).toHaveBeenCalledTimes(1);

      eventBus.emit({
        type: 'request:error',
        id: '2',
        error: new ApiError('Unauthorized', { kind: 'http', status: 401 }),
      });
      expect(redirectToLogin).toHaveBeenCalledTimes(1);
      expect(notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveWithFiles', () => {
    it('builds legacy multipart payload and posts to entities', async () => {
      const document = new File(['pdf'], 'document.pdf', { type: 'application/pdf' });
      const entity = {
        _id: 'entity1',
        sharedId: 'entity1',
        title: 'Entity 1',
        attachments: [
          {
            _id: 'attachment1',
            originalname: 'attachment.pdf',
            serializedFile: 'data:application/pdf;base64,cGRm',
          },
        ],
        documents: [{ data: 'blob:http://localhost/file', originalFile: document }],
      };

      const payload = buildSaveWithFilesPayload(entity);
      expect(payload.fields?.[0]?.name).toBe('entity');
      expect(payload.files?.map(file => file.name)).toEqual(['attachments[0]', 'documents[0]']);

      mockPostMultipart.mockResolvedValue([
        {
          entity: {
            _id: 'entity1',
            sharedId: 'entity1',
            language: 'en',
            template: 't1',
            creationDate: 1,
            user: 'u1',
            title: 'Entity 1',
          },
        },
      ]);

      const [saved, error] = await saveWithFiles(entity, {
        headers: { 'Content-Language': 'en' },
      });

      expect(error).toBeUndefined();
      expect(saved?.entity?.title).toBe('Entity 1');
      expect(mockPostMultipart).toHaveBeenCalledWith('entities', payload, {
        headers: { 'Content-Language': 'en' },
      });
    });

    it('uploads image metadata attachments and links them in entity json', async () => {
      const mediaPropertyNames = new Set(['image']);
      const mediaPropertyTypes = new Map<string, 'image' | 'media'>([['image', 'image']]);
      const entity = {
        _id: 'entity1',
        sharedId: 'entity1',
        title: 'Entity 1',
        template: 't1',
        metadata: {
          image: [{ value: 'localImageId' }],
        },
        attachments: [
          {
            _id: 'pending1',
            originalname: 'photo.jpg',
            filename: 'photo.jpg',
            serializedFile: 'data:image/jpeg;base64,aW1hZ2U=',
            fileLocalID: 'localImageId',
          },
        ],
      };

      mockPostMultipart.mockResolvedValue([
        {
          entity: {
            _id: 'entity1',
            sharedId: 'entity1',
            language: 'en',
            template: 't1',
            creationDate: 1,
            user: 'u1',
            title: 'Entity 1',
          },
        },
      ]);

      const [saved, error] = await saveWithFiles(entity, {
        headers: { 'Content-Language': 'en' },
        mediaPropertyNames,
        mediaPropertyTypes,
      });

      const payload = mockPostMultipart.mock.calls[0]?.[1] as ReturnType<
        typeof buildSaveWithFilesPayload
      >;
      const entityJson = JSON.parse(payload.fields?.[0]?.value ?? '{}') as {
        metadata?: { image?: Array<{ attachment?: number; value: string }> };
        attachments?: Array<{ serializedFile?: string }>;
      };

      expect(error).toBeUndefined();
      expect(saved?.entity?.title).toBe('Entity 1');
      expect(entityJson.metadata?.image).toEqual([{ value: '', attachment: 0 }]);
      expect(entityJson.attachments?.[0]?.serializedFile).toBeUndefined();
      expect(payload.files?.map(file => file.name)).toEqual(['attachments[0]']);
      expect(payload.files?.[0]?.filename).toBe('photo.jpg');
    });
  });
});
