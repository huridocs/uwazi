import libraryHelper from 'app/Library/helpers/libraryFilters';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('library helper', () => {
  const templates = [
    { _id: '1',
      properties: [
        { name: 'author', filter: false, type: 'text' },
        { name: 'country', filter: true, type: 'select', content: 'abc1' },
        { name: 'date', filter: true, type: 'text' },
        { name: 'language', filter: true, type: 'text' }
      ] },
    { _id: '2',
      properties: [
        { name: 'author', filter: false, type: 'text' },
        { name: 'country', filter: true, type: 'select', content: 'abc1' },
        { name: 'language', filter: false, type: 'text' }
      ] },
    { _id: '3',
      properties: [
        { name: 'author', filter: false, type: 'select' },
        { name: 'country', filter: true, type: 'text' }
      ] }
  ];

  const thesauris = [
    { _id: 'abc1', values: [{ id: 1, value: 'value1' }, { id: 2, value: 'value2' }] },
    { _id: 'thesauri2', type: 'template', values: [{ id: 3, value: 'value3' }, { id: 4, value: 'value4' }] },
    { _id: 'thesauri3', type: 'template', values: [{ id: 5, value: 'value5' }, { id: 6, value: 'value6' }] }
  ];

  describe('URLQueryToState', () => {
    it('should set default searchTerm to blank', () => {
      const query = {};

      const state = libraryHelper.URLQueryToState(query, templates, thesauris);
      expect(state.search.searchTerm).toBe('');
    });

    it('should return default values when not set', () => {
      const query = {
        searchTerm: 'searchTerm',
        types: []
      };

      const state = libraryHelper.URLQueryToState(query, templates, thesauris);
      expect(state.search.filters).toEqual({});
      expect(state.search.order).toEqual(prioritySortingCriteria.get().order);
      expect(state.search.sort).toEqual(prioritySortingCriteria.get().sort);
    });


    it('should return the query transformed to the application state', () => {
      const query = {
        searchTerm: 'searchTerm',
        order: 'order',
        sort: 'sort',
        types: ['3'],
        filters: { country: 'countryValue' }
      };

      const state = libraryHelper.URLQueryToState(query, templates, thesauris);
      expect(state.properties.length).toBe(1);
      expect(state.search.filters.country).toBe('countryValue');
      expect(state.search.searchTerm).toBe('searchTerm');
      expect(state.search.order).toBe('order');
      expect(state.search.sort).toBe('sort');
    });

    it('should populate filters with default values when they are not set', () => {
      const query = {
        searchTerm: 'searchTerm',
        types: ['1'],
        filters: {}
      };

      const state = libraryHelper.URLQueryToState(query, templates, thesauris);
      expect(state.search.filters.country).toEqual({});
      expect(state.search.filters.language).toBe('');
    });
  });

  describe('populateOptions', () => {
    it('should populate the filters with options', () => {
      const filters = [
        { name: 'country', filter: true, type: 'select', content: 'abc1' },
        { name: 'date', filter: true, type: 'text' },
        { name: 'country', filter: true, type: 'relationship' }
      ];

      const populatedFilters = libraryHelper.populateOptions(filters, thesauris);
      expect(populatedFilters[0].options).toEqual([{ id: 1, value: 'value1' }, { id: 2, value: 'value2' }]);
      expect(populatedFilters[1]).toEqual(filters[1]);
      expect(populatedFilters[2].options).toEqual([
        { id: 3, value: 'value3' },
        { id: 4, value: 'value4' },
        { id: 5, value: 'value5' },
        { id: 6, value: 'value6' }
      ]);
    });
  });

  describe('parseWithAggregations', () => {
    it('should add the number of results for facet browsing of each option', () => {
      const filters = [
        { name: 'country', filter: true, type: 'select', content: 'abc1', options: [{ id: 1, value: 'value1' }, { id: 2, value: 'value2' }] },
        { name: 'date', filter: true, type: 'text' }
      ];

      const aggregations = {
        all: {
          country: {
            buckets: [{
              key: 1,
              doc_count: 4,
              filtered: { doc_count: 2 }
            }]
          }
        }
      };

      const populatedFilters = libraryHelper.parseWithAggregations(filters, aggregations);
      expect(populatedFilters[0].options).toEqual([{ id: 1, value: 'value1', results: 2 }, { id: 2, value: 'value2', results: 0 }]);
    });
  });
});
