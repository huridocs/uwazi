import { encodeSearch } from '#app/Library/actions/libraryActions.js';
import {
  isLegacyRisonQuery,
  legacyRisonToLibraryUrlState,
  translateLegacySearchParams,
} from '../risonLegacy.js';
import { serializeLibrarySearchString } from '../libraryUrlState.js';

describe('risonLegacy', () => {
  it('detects a V1 q= rison blob', () => {
    expect(isLegacyRisonQuery(new URLSearchParams('q=(from:0,limit:30)'))).toBe(true);
    expect(isLegacyRisonQuery(new URLSearchParams('search=batman'))).toBe(false);
    expect(isLegacyRisonQuery(new URLSearchParams('q=batman'))).toBe(false);
  });

  it('translates encodeSearch output into compact URL state', () => {
    const q = encodeSearch(
      {
        searchTerm: 'batman',
        types: ['daw3raf34fasdf', 'asdfaf34faafsd'],
        filters: {
          country: { values: ['ES', 'FR'] },
          year: { from: 2020, to: 2021 },
        },
        from: 0,
        limit: 10,
        sort: 'title',
        order: 'asc',
      },
      false
    );

    expect(legacyRisonToLibraryUrlState(q)).toEqual({
      filters: {
        type: ['daw3raf34fasdf', 'asdfaf34faafsd'],
        country: ['ES', 'FR'],
        year: ['2020', '2021'],
      },
      andFilters: [],
      search: 'batman',
      limit: 10,
      from: 0,
      sort: 'title',
      order: 'asc',
      view: 'cards',
    });
  });

  it('maps includeUnpublished:!t to omitted status (all)', () => {
    const state = legacyRisonToLibraryUrlState('(includeUnpublished:!t,limit:30)');
    expect(state.filters.status).toBeUndefined();
    expect(state.limit).toBe(30);
  });

  it('maps unpublished-only to status:(restricted)', () => {
    const state = legacyRisonToLibraryUrlState('(unpublished:!t,includeUnpublished:!f)');
    expect(state.filters.status).toEqual(['restricted']);
  });

  it('rewrites URLSearchParams and drops q', () => {
    const next = translateLegacySearchParams(
      new URLSearchParams("q=(searchTerm:'batman',types:!('abc'),limit:10)")
    );
    expect(next.get('q')).toBeNull();
    expect(next.get('search')).toBe('batman');
    expect(next.get('filters')).toBe('(type:(abc))');
    expect(next.get('limit')).toBe('10');
  });

  it('keeps V1 and:true as andFilters', () => {
    const q = encodeSearch(
      {
        filters: {
          multiselect1: { values: ['EgyptID', 'SpainID'], and: true },
        },
      },
      false
    );
    const state = legacyRisonToLibraryUrlState(q);
    expect(state.filters.multiselect1).toEqual(['EgyptID', 'SpainID']);
    expect(state.andFilters).toEqual(['multiselect1']);
    expect(serializeLibrarySearchString(state)).toContain('andFilters=(multiselect1)');
  });
});
