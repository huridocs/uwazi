/**
 * @jest-environment node
 */
import { ApiError } from '#shared/apiClient/index.js';
import { apiClient } from '#V2/api/client.js';
import { countByRelationTypes } from '../countByRelationType.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
  },
}));

describe('countByRelationTypes', () => {
  beforeEach(() => {
    jest.mocked(apiClient.getJson).mockReset();
  });

  it('skips HTTP when ids is empty', async () => {
    await expect(countByRelationTypes([])).resolves.toEqual({});
    expect(apiClient.getJson).not.toHaveBeenCalled();
  });

  it('requests all ids in a single call', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ a: 1, b: 4 }]);
    const controller = new AbortController();

    await expect(countByRelationTypes(['a', 'b'], controller.signal)).resolves.toEqual({
      a: 1,
      b: 4,
    });
    expect(apiClient.getJson).toHaveBeenCalledTimes(1);
    expect(apiClient.getJson).toHaveBeenCalledWith(
      'references/count_by_relationtype',
      { relationtypeIds: 'a,b' },
      { signal: controller.signal }
    );
  });

  it('returns an empty map on error', async () => {
    jest
      .mocked(apiClient.getJson)
      .mockResolvedValue([undefined, new ApiError('fail', { kind: 'http', status: 500 })]);
    await expect(countByRelationTypes(['a'])).resolves.toEqual({});
  });
});
