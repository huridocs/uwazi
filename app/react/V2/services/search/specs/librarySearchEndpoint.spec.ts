import { fromSearchEndpointResult, toSearchEndpointQuery } from '../librarySearchEndpoint.js';

describe('librarySearchEndpoint', () => {
  it('maps compact library query to GET /api/search', () => {
    expect(
      toSearchEndpointQuery({
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
      include: ['permissions'],
    });
  });

  it('maps published and restricted to includeUnpublished / unpublished', () => {
    expect(toSearchEndpointQuery({ publishedStatus: 'published' })).toMatchObject({
      includeUnpublished: false,
      unpublished: false,
    });
    expect(toSearchEndpointQuery({ publishedStatus: 'restricted' })).toMatchObject({
      includeUnpublished: false,
      unpublished: true,
    });
  });

  it('maps search aggregations to library facet labels', () => {
    expect(
      fromSearchEndpointResult({
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
              buckets: [
                {
                  key: 'eu',
                  label: 'Europe',
                  filtered: { doc_count: 3 },
                  values: [{ key: 'ES', label: 'Spain', filtered: { doc_count: 1 } }],
                },
                { key: 'missing', filtered: { doc_count: 2 } },
                { key: 'empty', label: 'Empty', filtered: { doc_count: 0 } },
              ],
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
        properties: {
          country: [
            {
              id: 'eu',
              label: 'Europe',
              count: 3,
              values: [{ id: 'ES', label: 'Spain', count: 1 }],
            },
          ],
        },
      },
    });
  });

  it('keeps nested aggregations under the parent property instead of leaking keys', () => {
    const result = fromSearchEndpointResult({
      aggregations: {
        all: {
          causa: {
            numero: {
              buckets: [{ key: '1.1', filtered: { total: { filtered: { doc_count: 4 } } } }],
            },
            fecha: {
              buckets: [{ key: '2020', filtered: { doc_count: 2 } }],
            },
          },
          numero: {
            type: 'nested',
            buckets: [{ key: '1.1', filtered: { doc_count: 4 } }],
          },
        },
      },
    });

    expect(result.aggregations.properties.numero).toBeUndefined();
    expect(result.aggregations.properties.causa).toEqual([
      { id: 'numero', label: 'numero', count: 4, values: [{ id: '1.1', count: 4 }] },
      { id: 'fecha', label: 'fecha', count: 2, values: [{ id: '2020', count: 2 }] },
    ]);
  });

  it('maps nested dotted URL filters to the search endpoint nested shape', () => {
    expect(
      toSearchEndpointQuery({
        filters: { 'causa.numero': ['1.1', '2.1'], country: ['ES'] },
      })
    ).toMatchObject({
      filters: {
        causa: { properties: { numero: { values: ['1.1', '2.1'] } } },
        country: { values: ['ES'] },
      },
    });
  });

  it('sets and:true on list filters named in andFilters (V1 AND)', () => {
    expect(
      toSearchEndpointQuery({
        filters: { descriptores: ['d1', 'd2'], country: ['ES'] },
        andFilters: ['descriptores'],
      })
    ).toMatchObject({
      filters: {
        descriptores: { values: ['d1', 'd2'], and: true },
        country: { values: ['ES'] },
      },
    });
  });
});
