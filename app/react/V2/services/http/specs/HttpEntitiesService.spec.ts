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
    multipleUpdate: jest.fn(),
    getPermissions: jest.fn(),
    savePermissions: jest.fn(),
    searchCollaborators: jest.fn(),
  };
});

describe('HttpEntitiesService', () => {
  const saveWithFiles = jest.mocked(entitiesApi.saveWithFiles);
  const multipleUpdate = jest.mocked(entitiesApi.multipleUpdate);
  const getPermissions = jest.mocked(entitiesApi.getPermissions);
  const savePermissions = jest.mocked(entitiesApi.savePermissions);
  const searchCollaborators = jest.mocked(entitiesApi.searchCollaborators);

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

  it('forwards a multiple update in the active language', async () => {
    const request = {
      ids: ['a'],
      values: { metadata: { summary: [{ value: 'Hello' }] } },
    };
    multipleUpdate.mockResolvedValue([[{ sharedId: 'a' }]]);

    const response = await httpEntitiesService.multipleUpdate(request, {
      language: 'en',
      notifySuccess: false,
    });

    expect(multipleUpdate).toHaveBeenCalledWith(request, 'en', undefined);
    expect(response).toEqual([[{ sharedId: 'a' }]]);
  });

  it('forwards permission calls to the entities api', async () => {
    getPermissions.mockResolvedValue([[]]);
    savePermissions.mockResolvedValue([{ ids: ['s1'], permissions: [] }]);
    searchCollaborators.mockResolvedValue([[]]);

    await httpEntitiesService.getPermissions(['s1']);
    await httpEntitiesService.savePermissions({ ids: ['s1'], permissions: [] });
    await httpEntitiesService.searchCollaborators('alice');

    expect(getPermissions).toHaveBeenCalledWith(['s1'], undefined);
    expect(savePermissions).toHaveBeenCalledWith({ ids: ['s1'], permissions: [] }, undefined);
    expect(searchCollaborators).toHaveBeenCalledWith('alice', undefined);
  });
});
