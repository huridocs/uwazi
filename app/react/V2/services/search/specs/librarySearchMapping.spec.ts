import { fromV1SearchResult, toV1SearchQuery } from '../librarySearchMapping.js';

describe('librarySearchMapping', () => {
  it('maps compact library query to the existing search payload', () => {
    expect(
      toV1SearchQuery({
        searchTerm: 'batman',
        templateIds: ['t1'],
        filters: { country: ['ES', 'FR'], year: ['2020', '2021'] },
        publishedStatus: 'all',
        from: 0,
        limit: 10,
        sort: 'title',
        order: 'asc',
      })
    ).toEqual({
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
    });
  });

  it('maps published and restricted to the legacy flags', () => {
    expect(toV1SearchQuery({ publishedStatus: 'published' })).toMatchObject({
      includeUnpublished: false,
      unpublished: false,
    });
    expect(toV1SearchQuery({ publishedStatus: 'restricted' })).toMatchObject({
      includeUnpublished: false,
      unpublished: true,
    });
  });

  it('maps V1 aggregations to library facet labels', () => {
    expect(
      fromV1SearchResult({
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
      })
    ).toEqual({
      rows: [{ _id: '1', sharedId: 'a', title: 'Case', template: 't1', language: 'en' }],
      totalRows: 1,
      aggregations: {
        templates: [{ id: 't1', count: 1 }],
        published: { published: 4, restricted: 2 },
        properties: { country: [{ id: 'ES', label: 'Spain', count: 1 }] },
      },
    });
  });
});
