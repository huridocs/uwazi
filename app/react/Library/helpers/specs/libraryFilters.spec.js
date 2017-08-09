import libraryHelper from 'app/Library/helpers/libraryFilters';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('library helper', () => {
  let templates = [
    {_id: '1', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'select', content: 'abc1'},
      {name: 'date', filter: true, type: 'text'},
      {name: 'language', filter: true, type: 'text'}
    ]},
    {_id: '2', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'select', content: 'abc1'},
      {name: 'language', filter: false, type: 'text'}
    ]},
    {_id: '3', properties: [
      {name: 'author', filter: false, type: 'text'},
      {name: 'country', filter: true, type: 'text'}
    ]}
  ];

  let thesauris = [{_id: 'abc1', values: [{id: 1, value: 'value1'}, {id: 2, value: 'value2'}]}];

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
        filters: {country: 'countryValue'}
      };

      const state = libraryHelper.URLQueryToState(query, templates, thesauris);
      expect(state.properties.length).toBe(1);
      expect(state.properties[0].active).toBe(true);
      expect(state.search.filters.country).toBe('countryValue');
      expect(state.search.searchTerm).toBe('searchTerm');
      expect(state.search.order).toBe('order');
      expect(state.search.sort).toBe('sort');
    });
  });

  describe('populateOptions', () => {
    it('should populate the filters with options', () => {
      let filters = [
        {name: 'country', filter: true, type: 'select', content: 'abc1'},
        {name: 'date', filter: true, type: 'text'}
      ];

      let populatedFilters = libraryHelper.populateOptions(filters, thesauris);
      expect(populatedFilters[0].options).toEqual([{id: 1, value: 'value1'}, {id: 2, value: 'value2'}]);
    });
  });

  describe('parseWithAggregations', () => {
    it('should add the number of results for facet browsing of each option', () => {
      let filters = [
        {name: 'country', filter: true, type: 'select', content: 'abc1', options: [{id: 1, value: 'value1'}, {id: 2, value: 'value2'}]},
        {name: 'date', filter: true, type: 'text'}
      ];

      let aggregations = {
        all: {
          country: {
            buckets: [{
              key: 1,
              doc_count: 4,
              filtered: {doc_count: 2}
            }]
          }
        }
      };

      let populatedFilters = libraryHelper.parseWithAggregations(filters, aggregations);
      expect(populatedFilters[0].options).toEqual([{id: 1, value: 'value1', results: 2}, {id: 2, value: 'value2', results: 0}]);
    });
  });
});
