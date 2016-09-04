import libraryHelper from 'app/Library/helpers/libraryFilters';

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

  describe('libraryFilters()', () => {
    describe('When only one documentType is selected', () => {
      it('should return all its filters fields with thesauri options', () => {
        let documentTypes = ['1'];
        let filters = libraryHelper.libraryFilters(templates, documentTypes, thesauris);
        expect(filters)
        .toEqual([
          {name: 'country', filter: true, type: 'select', content: 'abc1'},
          {name: 'date', filter: true, type: 'text'},
          {name: 'language', filter: true, type: 'text'}
        ]);
      });
    });

    describe('When more than one documentType is selected', () => {
      it('should return all filters fields that are in the selected templates', () => {
        let documentTypes = ['1', '2'];
        let filters = libraryHelper.libraryFilters(templates, documentTypes);
        expect(filters).toEqual([{name: 'country', filter: true, type: 'select', content: 'abc1'}]);
      });

      describe('when none match', () => {
        it('should return none', () => {
          let documentTypes = ['1', '2', '3'];
          let filters = libraryHelper.libraryFilters(templates, documentTypes);
          expect(filters).toEqual([]);
        });
      });
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
        country: {
          buckets: [{
            key: 1,
            doc_count: 4,
            filtered: {doc_count: 2}
          }]
        }
      };

      let populatedFilters = libraryHelper.parseWithAggregations(filters, aggregations);
      expect(populatedFilters[0].options).toEqual([{id: 1, value: 'value1', results: 2, total: 4}]);
    });
  });
});
