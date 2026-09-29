/**
 * @jest-environment node
 */
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

  it('unwraps apiClient primitive wrapper { value }', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ value: 3 }]);

    const [counts, error] = await checkEntityCounts(['t1']);

    expect(error).toBeUndefined();
    expect(counts).toEqual({ t1: 3 });
  });
});
