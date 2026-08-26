import { search } from '#api/search/index.js';
import { createSearchQueryService } from '../SearchQueryService.js';

jest.mock('#api/search/index.js', () => ({
  search: {
    search: jest.fn(),
  },
}));

const searchMock = search.search as jest.Mock;

describe('SearchQueryService (SSR)', () => {
  const service = createSearchQueryService({
    headers: {},
    language: 'en',
    user: { _id: 'u1', role: 'editor', username: 'editor' },
  });

  beforeEach(() => {
    searchMock.mockReset();
    searchMock.mockResolvedValue({
      rows: [{ title: 'Batman', sharedId: 'abc', template: 't1', language: 'en' }],
      totalRows: 1,
      aggregations: { all: { _types: { buckets: [] } } },
    });
  });

  it('calls the existing search with the adapted query', async () => {
    const [data, error] = await service.searchLibrary({
      searchTerm: 'batman',
      templateIds: ['t1'],
      publishedStatus: 'all',
      from: 0,
      limit: 10,
    });

    expect(error).toBeUndefined();
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: 'batman',
        types: ['t1'],
        includeUnpublished: true,
        unpublished: false,
        aggregatePublishingStatus: true,
      }),
      'en',
      expect.objectContaining({ _id: 'u1' })
    );
    expect(data?.rows[0]?.title).toBe('Batman');
    expect(data?.aggregations).toEqual({
      templates: [],
      published: { published: 0, restricted: 0 },
      properties: {},
    });
  });
});
