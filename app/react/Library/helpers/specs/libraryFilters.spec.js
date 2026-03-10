import libraryHelper from 'app/Library/helpers/libraryFilters';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('library helper', () => {
  const templates = [
    {
      _id: '1',
      properties: [
        { name: 'author', filter: false, type: 'text' },
        { name: 'country', filter: true, type: 'select', content: 'abc1' },
        { name: 'date', filter: true, type: 'text' },
        { name: 'language', filter: true, type: 'text' },
        { name: 'rich', filter: true, type: 'markdown' },
        { name: 'id', filter: true, type: 'generatedid' },
      ],
    },
    {
      _id: '2',
      properties: [
        { name: 'author', filter: false, type: 'text' },
        { name: 'country', filter: true, type: 'select', content: 'abc1' },
        { name: 'language', filter: false, type: 'text' },
      ],
    },
    {
      _id: '3',
      properties: [
        { name: 'author', filter: false, type: 'select' },
        { name: 'country', filter: true, type: 'text' },
      ],
    },
  ];

  const thesauris = [
    {
      _id: 'abc1',
      values: [
        { id: 1, value: 'value1' },
        { id: 2, value: 'value2' },
      ],
    },
    {
      _id: 'thesauri2',
      type: 'template',
      values: [
        { id: 3, value: 'value3' },
        { id: 4, value: 'value4' },
      ],
    },
    {
      _id: 'thesauri3',
      type: 'template',
      values: [
        { id: 5, value: 'value5' },
        { id: 6, value: 'value6' },
      ],
    },
  ];

  describe('URLQueryToState', () => {
    it('should set default searchTerm to blank', () => {
      const query = {};

      const state = libraryHelper.URLQueryToState(query, templates);
      expect(state.search.searchTerm).toBe('');
    });

    it('should return default values when not set', () => {
      const query = {
        searchTerm: 'searchTerm',
        types: [],
        userSelectedSorting: false,
      };

      const defaultSorting = prioritySortingCriteria.get();

      const state = libraryHelper.URLQueryToState(query, templates);
      expect(state.search).toMatchObject({
        searchTerm: 'searchTerm',
        filters: {},
        userSelectedSorting: false,
        allAggregations: false,
        treatAs: 'number',
        order: defaultSorting.order,
        sort: defaultSorting.sort,
      });
    });

    it('should return the query transformed to the application state', () => {
      const query = {
        searchTerm: 'searchTerm',
        order: 'order',
        sort: 'sort',
        types: ['3'],
        filters: { country: 'countryValue', rich: 'search' },
        customFilters: {
          property: { values: ['value'] },
        },
      };

      const state = libraryHelper.URLQueryToState(query, templates);
      expect(state.properties.length).toBe(1);
      expect(state.search.customFilters).toEqual(query.customFilters);
      expect(state.search.filters.country).toBe('countryValue');
      expect(state.search.filters.rich).toBe('search');
      expect(state.search.searchTerm).toBe('searchTerm');
      expect(state.search.order).toBe('order');
      expect(state.search.sort).toBe('sort');
    });
  });

  describe('populateOptions', () => {
    it('should populate the filters with options', () => {
      const filters = [
        { name: 'country', filter: true, type: 'select', content: 'abc1' },
        { name: 'date', filter: true, type: 'text' },
        { name: 'country', filter: true, type: 'relationship' },
      ];

      const populatedFilters = libraryHelper.populateOptions(filters, thesauris);
      expect(populatedFilters[0].options).toEqual([
        { id: 1, value: 'value1' },
        { id: 2, value: 'value2' },
      ]);
      expect(populatedFilters[1]).toEqual(filters[1]);
      expect(populatedFilters[2].options).toEqual([
        { id: 3, value: 'value3' },
        { id: 4, value: 'value4' },
        { id: 5, value: 'value5' },
        { id: 6, value: 'value6' },
      ]);
    });
    describe('when property unknown content id is provided', () => {
      it('should return null as options', () => {
        const filters = [{ content: 'unknown' }];
        const result = libraryHelper.populateOptions(filters, thesauris);
        expect(result[0].options).toBe(null);
      });
    });
  });

  describe('parseWithAggregations', () => {
    it('should add the number of results for facet browsing of each option', () => {
      const filters = [
        {
          name: 'country',
          filter: true,
          type: 'select',
          content: 'abc1',
          options: [
            { id: 1, value: 'value1' },
            { id: 2, value: 'value2' },
          ],
        },
        { name: 'date', filter: true, type: 'text' },
      ];

      const aggregations = {
        all: {
          country: {
            count: 27,
            buckets: [
              {
                key: 1,
                doc_count: 4,
                label: 'value1',
                filtered: { doc_count: 2 },
              },
              {
                key: 'missing',
                doc_count: 3,
                label: 'No value',
                filtered: { doc_count: 2 },
              },
            ],
          },
        },
      };

      const populatedFilters = libraryHelper.parseWithAggregations(filters, aggregations);
      expect(populatedFilters[0].options).toEqual([
        { id: 1, value: 1, label: 'value1', results: 2 },
        { id: 'missing', value: 'missing', label: 'No value', results: 2, noValueKey: true },
      ]);
    });
  });
});
