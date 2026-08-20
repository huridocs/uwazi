import { toV1SearchQuery, statusToV1Flags } from '../librarySearch.js';

describe('librarySearch', () => {
  it('maps omitted status to includeUnpublished (all)', () => {
    expect(statusToV1Flags(undefined)).toEqual({ includeUnpublished: true, unpublished: false });
    expect(statusToV1Flags(['published', 'restricted'])).toEqual({
      includeUnpublished: true,
      unpublished: false,
    });
  });

  it('maps published-only and restricted-only', () => {
    expect(statusToV1Flags(['published'])).toEqual({
      includeUnpublished: false,
      unpublished: false,
    });
    expect(statusToV1Flags(['restricted'])).toEqual({
      includeUnpublished: false,
      unpublished: true,
    });
  });

  it('builds a V1 search payload from compact filters', () => {
    expect(
      toV1SearchQuery({
        filters: {
          type: ['t1'],
          country: ['ES', 'FR'],
          year: ['2020', '2021'],
        },
        search: 'batman',
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
});
