import {
  DEFAULT_LIBRARY_URL_STATE,
  parseCompactFilters,
  serializeCompactFilters,
  parseAndFilters,
  serializeAndFilters,
  parseLibrarySearchParams,
  serializeLibrarySearchParams,
  serializeLibrarySearchString,
  normalizeFilters,
  publishedStatusFromFilters,
} from '../libraryUrlState.js';

describe('libraryUrlState', () => {
  describe('compact filters', () => {
    it('round-trips the canonical example', () => {
      const raw = '(country:(ES,FR),type:(daw3raf34fasdf,asdfaf34faafsd),year:(2020,2021))';
      const parsed = parseCompactFilters(raw);
      expect(parsed).toEqual({
        country: ['ES', 'FR'],
        type: ['daw3raf34fasdf', 'asdfaf34faafsd'],
        year: ['2020', '2021'],
      });
      expect(serializeCompactFilters(parsed!)).toBe(raw);
    });

    it('parses empty and quoted values', () => {
      expect(parseCompactFilters('')).toEqual({});
      expect(parseCompactFilters('()')).toEqual({});
      expect(parseCompactFilters("(title:('hello world'))")).toEqual({
        title: ['hello world'],
      });
      expect(serializeCompactFilters({ title: ['hello world'] })).toBe("(title:('hello world'))");
    });

    it('returns null for invalid input', () => {
      expect(parseCompactFilters('country:ES')).toBeNull();
      expect(parseCompactFilters('(country:ES)')).toBeNull();
    });

    it('drops status when both published and restricted are selected', () => {
      expect(normalizeFilters({ status: ['published', 'restricted'], type: ['a'] })).toEqual({
        type: ['a'],
      });
    });

    it('maps omitted status to all, and single values to published or restricted', () => {
      expect(publishedStatusFromFilters(undefined)).toBe('all');
      expect(publishedStatusFromFilters(['published', 'restricted'])).toBe('all');
      expect(publishedStatusFromFilters(['published'])).toBe('published');
      expect(publishedStatusFromFilters(['restricted'])).toBe('restricted');
    });
  });

  describe('search params', () => {
    it('omits defaults from the serialized URL', () => {
      const state = {
        filters: { type: ['abc'] },
        andFilters: [],
        search: 'batman',
        limit: 30,
        from: 0,
        sort: '',
        order: 'desc' as const,
        view: 'cards' as const,
      };
      expect(serializeLibrarySearchString(state)).toBe('filters=(type:(abc))&search=batman');
      expect(parseLibrarySearchParams(serializeLibrarySearchParams(state))).toEqual(state);
    });

    it('keeps non-default pagination and sort', () => {
      const params = serializeLibrarySearchParams({
        filters: {},
        search: '',
        limit: 10,
        from: 30,
        sort: 'title',
        order: 'asc',
        view: 'list',
      });
      expect(params.get('limit')).toBe('10');
      expect(params.get('from')).toBe('30');
      expect(params.get('sort')).toBe('title');
      expect(params.get('order')).toBe('asc');
      expect(params.get('view')).toBe('list');
    });

    it('round-trips AND properties as andFilters=(name)', () => {
      const state = {
        ...DEFAULT_LIBRARY_URL_STATE,
        filters: { descriptores: ['d1', 'd2'] },
        andFilters: ['descriptores'],
      };
      expect(serializeLibrarySearchString(state)).toBe(
        'filters=(descriptores:(d1,d2))&andFilters=(descriptores)'
      );
      expect(parseLibrarySearchParams(serializeLibrarySearchParams(state))).toEqual(state);
    });

    it('parses and serializes andFilters lists', () => {
      expect(parseAndFilters('')).toEqual([]);
      expect(parseAndFilters('()')).toEqual([]);
      expect(parseAndFilters('(descriptores,related)')).toEqual(['descriptores', 'related']);
      expect(parseAndFilters('descriptores')).toBeNull();
      expect(serializeAndFilters(['descriptores', 'related'])).toBe('(descriptores,related)');
      expect(serializeAndFilters([])).toBe('');
    });

    it('keeps map, table and timeline view params', () => {
      const params = serializeLibrarySearchParams({
        ...DEFAULT_LIBRARY_URL_STATE,
        view: 'map',
      });
      expect(params.get('view')).toBe('map');
      expect(parseLibrarySearchParams(new URLSearchParams('view=table')).view).toBe('table');
      expect(parseLibrarySearchParams(new URLSearchParams('view=timeline')).view).toBe('timeline');
      expect(parseLibrarySearchParams(new URLSearchParams('view=bogus')).view).toBe('cards');
    });
  });
});
