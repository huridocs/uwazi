/**
 * @jest-environment node
 */
import { ApiError } from '#shared/apiClient/index.js';
import { apiClient } from '#V2/api/client.js';
import { checkEntityCounts } from '../index.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
  },
}));

describe('checkEntityCounts', () => {
  beforeEach(() => {
    jest.mocked(apiClient.getJson).mockReset();
  });

  it('skips HTTP when templateIds is empty', async () => {
    await expect(checkEntityCounts([])).resolves.toEqual([{}]);
    expect(apiClient.getJson).not.toHaveBeenCalled();
  });

  it('requests all templateIds in a single call', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ t1: 3, t2: 0 }]);

    const [counts, error] = await checkEntityCounts(['t1', 't2']);

    expect(error).toBeUndefined();
    expect(counts).toEqual({ t1: 3, t2: 0 });
    expect(apiClient.getJson).toHaveBeenCalledTimes(1);
    expect(apiClient.getJson).toHaveBeenCalledWith(
      'v2/entities/count_by_template',
      { templateIds: 't1,t2' },
      { headers: undefined }
    );
  });

  it('returns the error', async () => {
    const apiError = new ApiError('fail', { kind: 'http', status: 500 });
    jest.mocked(apiClient.getJson).mockResolvedValue([undefined, apiError]);

    const [, error] = await checkEntityCounts(['t1']);

    expect(error).toBe(apiError);
  });
});
