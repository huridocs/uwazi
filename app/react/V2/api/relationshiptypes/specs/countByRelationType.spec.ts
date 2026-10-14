/**
 * @jest-environment jsdom
 */
import { ApiError } from '#shared/apiClient/index.js';
import { apiClient } from '#V2/api/client.js';
import { countByRelationType, countByRelationTypes } from '../countByRelationType.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
  },
}));

describe('countByRelationType', () => {
  beforeEach(() => {
    jest.mocked(apiClient.getJson).mockReset();
  });

  it('unwraps a primitive number', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([4]);
    await expect(countByRelationType('type-1')).resolves.toBe(4);
  });

  it('unwraps apiClient primitive wrapper { value }', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ value: 1 }]);
    await expect(countByRelationType('type-1')).resolves.toBe(1);
    expect(apiClient.getJson).toHaveBeenCalledWith(
      'references/count_by_relationtype',
      { relationtypeId: 'type-1' },
      { signal: undefined }
    );
  });

  it('passes AbortSignal on the getJson context', async () => {
    const controller = new AbortController();
    jest.mocked(apiClient.getJson).mockResolvedValue([2]);
    await countByRelationType('type-1', controller.signal);
    expect(apiClient.getJson).toHaveBeenCalledWith(
      'references/count_by_relationtype',
      { relationtypeId: 'type-1' },
      { signal: controller.signal }
    );
  });

  it('returns undefined on error or unexpected payload', async () => {
    jest
      .mocked(apiClient.getJson)
      .mockResolvedValue([undefined, new ApiError('fail', { kind: 'http', status: 500 })]);
    await expect(countByRelationType('type-1')).resolves.toBeUndefined();

    jest.mocked(apiClient.getJson).mockResolvedValue([{}]);
    await expect(countByRelationType('type-1')).resolves.toBeUndefined();
  });
});

describe('countByRelationTypes', () => {
  beforeEach(() => {
    jest.mocked(apiClient.getJson).mockReset();
  });

  it('requests every relation type count with no id', async () => {
    const controller = new AbortController();
    jest.mocked(apiClient.getJson).mockResolvedValue([{ a: 1, b: 4 }]);

    await expect(countByRelationTypes(controller.signal)).resolves.toEqual({ a: 1, b: 4 });
    expect(apiClient.getJson).toHaveBeenCalledTimes(1);
    expect(apiClient.getJson).toHaveBeenCalledWith(
      'references/count_by_relationtype',
      {},
      {
        signal: controller.signal,
      }
    );
  });

  it('returns an empty map when the request fails', async () => {
    jest
      .mocked(apiClient.getJson)
      .mockResolvedValue([undefined, new ApiError('fail', { kind: 'http', status: 500 })]);

    await expect(countByRelationTypes()).resolves.toEqual({});
  });
});
