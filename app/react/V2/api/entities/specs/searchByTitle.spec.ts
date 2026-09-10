/**
 * @jest-environment node
 */
import qs from 'qs';
import { apiClient } from '#V2/api/client.js';
import { searchByTitle } from '../index.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
  },
}));

describe('searchByTitle', () => {
  beforeEach(() => {
    jest.mocked(apiClient.getJson).mockReset();
  });

  it('omits searchString when the title is empty and can filter by template', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([
      {
        data: [{ _id: '1', sharedId: 'a', title: 'Argentina', template: 'country' }],
      },
    ]);

    const [rows] = await searchByTitle({ template: ['country'], limit: 50 });

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'v2/search',
      qs.stringify({
        fields: ['title', 'sharedId', 'template'],
        filter: { template: { values: ['country'], operator: 'OR' } },
        page: { limit: 50 },
      }),
      expect.any(Object)
    );
    expect(rows).toEqual([{ _id: '1', sharedId: 'a', title: 'Argentina', template: 'country' }]);
  });

  it('adds a title searchString when a term is provided', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ data: [] }]);

    await searchByTitle({ title: 'Colom', template: ['country'] });

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'v2/search',
      qs.stringify({
        fields: ['title', 'sharedId', 'template'],
        filter: {
          searchString: 'title:Colom~2',
          template: { values: ['country'], operator: 'OR' },
        },
      }),
      expect.any(Object)
    );
  });
});
