import {
  parseCompactFilters,
  serializeCompactFilters,
  parseLibrarySearchParams,
  serializeLibrarySearchParams,
  serializeLibrarySearchString,
  normalizeFilters,
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
  });

  describe('search params', () => {
    it('omits defaults from the serialized URL', () => {
      const state = {
        filters: { type: ['abc'] },
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
  });
});
