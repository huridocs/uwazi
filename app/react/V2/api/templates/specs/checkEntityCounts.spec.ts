/**
 * @jest-environment node
 */
import { apiClient } from '#V2/api/client.js';
import { checkEntityCount, checkEntityCounts } from '../index.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
  },
}));

describe('checkEntityCounts', () => {
  beforeEach(() => {
    jest.mocked(apiClient.getJson).mockReset();
  });

  it('requests every template count with no id', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ t1: 3 }]);

    const [counts, error] = await checkEntityCounts();

    expect(error).toBeUndefined();
    expect(counts).toEqual({ t1: 3 });
    expect(apiClient.getJson).toHaveBeenCalledWith(
      'v2/entities/count_by_template',
      {},
      {
        headers: undefined,
      }
    );
  });

  it('reads one template count from the primitive wrapper', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ value: 4 }]);

    const [count, error] = await checkEntityCount('t1');

    expect(error).toBeUndefined();
    expect(count).toBe(4);
    expect(apiClient.getJson).toHaveBeenCalledWith(
      'v2/entities/count_by_template',
      { templateId: 't1' },
      { headers: undefined }
    );
  });
});
