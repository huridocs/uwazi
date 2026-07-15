/**
 * @jest-environment jsdom
 */
import { ApiError } from '#shared/apiClient/index.js';
import * as entitiesApi from '#V2/api/entities/index.js';
import { httpEntitiesService } from '../HttpEntitiesService.js';

jest.mock('#V2/api/entities/index.js', () => {
  const actual = jest.requireActual<typeof import('#V2/api/entities/index.js')>(
    '#V2/api/entities/index.js'
  );
  return {
    ...actual,
    saveWithFiles: jest.fn(),
  };
});

describe('HttpEntitiesService', () => {
  const saveWithFiles = jest.mocked(entitiesApi.saveWithFiles);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an error when the save response has no entity', async () => {
    saveWithFiles.mockResolvedValue([{ errors: ['attachment failed'] }]);

    const [entity, error] = await httpEntitiesService.upsert(
      { _id: '1', sharedId: '1', title: 'Entity', template: 't1', language: 'en' },
      { notifySuccess: false }
    );

    expect(entity).toBeUndefined();
    expect(error).toBeInstanceOf(ApiError);
    expect(error?.code).toBe('missing_entity');
  });

  it('forwards abort signals to saveWithFiles', async () => {
    const controller = new AbortController();
    saveWithFiles.mockResolvedValue([
      {
        entity: {
          _id: '1',
          sharedId: '1',
          title: 'Entity',
          template: 't1',
          language: 'en',
          creationDate: 1,
          user: 'u1',
        },
      },
    ]);

    await httpEntitiesService.upsert(
      { _id: '1', sharedId: '1', title: 'Entity', template: 't1', language: 'en' },
      { signal: controller.signal, notifySuccess: false }
    );

    expect(saveWithFiles).toHaveBeenCalledWith(
      expect.objectContaining({ sharedId: '1' }),
      expect.objectContaining({ signal: controller.signal })
    );
  });
});
