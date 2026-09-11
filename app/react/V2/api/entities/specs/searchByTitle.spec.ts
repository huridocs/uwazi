/**
 * @jest-environment node
 */
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

  it('calls GET /api/search and can filter by template', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([
      {
        rows: [{ _id: '1', sharedId: 'a', title: 'Argentina', template: 'country' }],
      },
    ]);

    const [rows] = await searchByTitle({ template: ['country'], limit: 50 });

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'search',
      {
        fields: ['title', 'sharedId', 'template'],
        includeUnpublished: true,
        types: ['country'],
        limit: 50,
      },
      expect.any(Object)
    );
    expect(rows).toEqual([{ _id: '1', sharedId: 'a', title: 'Argentina', template: 'country' }]);
  });

  it('adds searchTerm when a title is provided', async () => {
    jest.mocked(apiClient.getJson).mockResolvedValue([{ rows: [] }]);

    await searchByTitle({ title: 'Colom', template: ['country'] });

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'search',
      {
        fields: ['title', 'sharedId', 'template'],
        includeUnpublished: true,
        searchTerm: 'Colom',
        types: ['country'],
      },
      expect.any(Object)
    );
  });
});
