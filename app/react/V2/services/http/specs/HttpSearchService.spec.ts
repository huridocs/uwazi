/**
 * @jest-environment node
 */
import { ApiError } from '#shared/apiClient/index.js';
import { apiClient } from '#V2/api/client.js';
import { httpSearchService } from '../HttpSearchService.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
  },
}));

const getJson = jest.mocked(apiClient.getJson);

describe('HttpSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getJson.mockResolvedValue([
      {
        rows: [{ _id: '1', sharedId: 'a', title: 'Case', template: 't1', language: 'en' }],
        totalRows: 1,
        aggregations: {
          all: {
            _types: {
              buckets: [{ key: 't1', filtered: { doc_count: 1 } }],
            },
            _published: {
              buckets: [
                { key: 'true', filtered: { doc_count: 4 } },
                { key: 'false', filtered: { doc_count: 2 } },
              ],
            },
            country: {
              buckets: [{ key: 'ES', label: 'Spain', filtered: { doc_count: 1 } }],
            },
          },
        },
      },
    ]);
  });

  it('translates the library query to GET /api/search and maps the response', async () => {
    const [data, error] = await httpSearchService.searchLibrary(
      {
        searchTerm: 'batman',
        templateIds: ['t1'],
        filters: { country: ['ES', 'FR'], year: ['2020', '2021'] },
        publishedStatus: 'all',
        from: 0,
        limit: 10,
        sort: 'title',
        order: 'asc',
      },
      { language: 'es' }
    );

    expect(error).toBeUndefined();
    expect(getJson).toHaveBeenCalledWith(
      'search',
      {
        searchTerm: 'batman',
        types: ['t1'],
        filters: {
          country: { values: ['ES', 'FR'] },
          year: { from: 2020, to: 2021 },
        },
        from: 0,
        limit: 10,
        sort: 'title',
        order: 'asc',
        includeUnpublished: true,
        unpublished: false,
        aggregatePublishingStatus: true,
        include: ['permissions'],
      },
      expect.objectContaining({ language: 'es' })
    );
    expect(data).toEqual({
      rows: [{ _id: '1', sharedId: 'a', title: 'Case', template: 't1', language: 'en' }],
      totalRows: 1,
      aggregations: {
        templates: [{ id: 't1', count: 1 }],
        published: { published: 4, restricted: 2 },
        properties: { country: [{ id: 'ES', label: 'Spain', count: 1 }] },
      },
    });
  });

  it('maps published and restricted to includeUnpublished / unpublished', async () => {
    await httpSearchService.searchLibrary({ publishedStatus: 'published' });
    expect(getJson).toHaveBeenCalledWith(
      'search',
      expect.objectContaining({ includeUnpublished: false, unpublished: false }),
      expect.any(Object)
    );

    await httpSearchService.searchLibrary({ publishedStatus: 'restricted' });
    expect(getJson).toHaveBeenCalledWith(
      'search',
      expect.objectContaining({ includeUnpublished: false, unpublished: true }),
      expect.any(Object)
    );
  });

  it('returns the apiClient error without mapping', async () => {
    const apiError = new ApiError('unavailable', { kind: 'http', status: 503, retryable: true });
    getJson.mockResolvedValue([undefined, apiError]);

    const [data, error] = await httpSearchService.searchLibrary({ searchTerm: 'batman' });

    expect(data).toBeUndefined();
    expect(error).toBe(apiError);
  });
});
