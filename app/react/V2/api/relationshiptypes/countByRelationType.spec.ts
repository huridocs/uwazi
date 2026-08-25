/**
 * @jest-environment node
 */
import { ApiError } from '#shared/apiClient/index.js';
import { apiClient } from '#V2/api/client.js';
import { countByRelationType, countByRelationTypes } from './countByRelationType.js';

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

  it('skips HTTP when ids is empty', async () => {
    await expect(countByRelationTypes([])).resolves.toEqual({});
    expect(apiClient.getJson).not.toHaveBeenCalled();
  });

  it('returns counts for each id and unwraps { value }', async () => {
    jest
      .mocked(apiClient.getJson)
      .mockResolvedValueOnce([{ value: 1 }])
      .mockResolvedValueOnce([4]);
    const controller = new AbortController();
    await expect(countByRelationTypes(['a', 'b'], controller.signal)).resolves.toEqual({
      a: 1,
      b: 4,
    });
    expect(apiClient.getJson).toHaveBeenCalledTimes(2);
    expect(apiClient.getJson).toHaveBeenNthCalledWith(
      1,
      'references/count_by_relationtype',
      { relationtypeId: 'a' },
      { signal: controller.signal }
    );
  });

  it('omits ids whose count fails and does not fail the batch', async () => {
    jest
      .mocked(apiClient.getJson)
      .mockResolvedValueOnce([3])
      .mockResolvedValueOnce([undefined, new ApiError('fail', { kind: 'http', status: 500 })]);
    await expect(countByRelationTypes(['ok', 'bad'])).resolves.toEqual({ ok: 3 });
  });
});
