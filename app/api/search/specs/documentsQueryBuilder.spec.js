import queryBuilder from 'api/search/documentQueryBuilder';

describe('documentQueryBuilder', () => {
  beforeEach(() => {});

  describe('default query', () => {
    it('should do a match all on published documents', () => {
      expect(queryBuilder().query().query.bool.must[0]).toEqual({match: {'doc.published': true}});
    });
  });

  describe('from', () => {
    it('should set from', () => {
      expect(queryBuilder().from(5).query().from).toEqual(5);
    });
  });

  describe('limit', () => {
    it('should set size', () => {
      expect(queryBuilder().limit(55).query().size).toEqual(55);
    });
  });

  describe('language', () => {
    it('should set language', () => {
      let baseQuery = queryBuilder().language('es').query();
      expect(baseQuery.query.bool.must[1]).toEqual({match: {'doc.language': 'es'}});

      baseQuery = queryBuilder().language('en').query();
      expect(baseQuery.query.bool.must[1]).toEqual({match: {'doc.language': 'en'}});
    });
  });

  describe('filterMetadata', () => {
    it('should add filter conditions', () => {
      let baseQuery = queryBuilder().filterMetadata({
        property1: {value: 'value1', type: 'text'},
        property2: {value: 'value2', type: 'text'}
      }).query();
      expect(baseQuery.filter.bool.must[0]).toEqual({match: {'doc.metadata.property1': 'value1'}});
      expect(baseQuery.filter.bool.must[1]).toEqual({match: {'doc.metadata.property2': 'value2'}});
    });

    it('should filter range filters', () => {
      let baseQuery = queryBuilder().filterMetadata({property1: {value: {from: 10, to: 20}, type: 'range'}}).query();
      expect(baseQuery.filter.bool.must[0]).toEqual({range: {'doc.metadata.property1': {gte: 10, lte: 20}}});
    });

    it('should filter multiselect filters', () => {
      let baseQuery = queryBuilder().filterMetadata({property1: {value: [23, 4, 16], type: 'multiselect'}}).query();
      expect(baseQuery.filter.bool.must[0]).toEqual({terms: {'doc.metadata.property1.raw': [23, 4, 16]}});
    });
  });

  describe('filterByTemplate', () => {
    it('should add a match to get only documents that match with the templates', () => {
      let baseQuery = queryBuilder().filterByTemplate(['template1', 'template2']).query();
      let expectedMatcher = {terms: {'doc.template.raw': ['template1', 'template2']}};
      expect(baseQuery.filter.bool.must[0]).toEqual(expectedMatcher);
    });
  });

  describe('aggregations', () => {

    it('default aggregations should contain types', () => {
      let baseQuery = queryBuilder().query();
      let typesAggregation = {
        terms: {
          field: 'doc.template.raw',
          size: 0
        },
        aggregations: {
          filtered: {
            filter: {
              bool: {
                must: []
              }
            }
          }
        }
      };
      expect(baseQuery.aggregations.types).toEqual(typesAggregation);
    });

    it('should add aggregations to the query with the current filters', () => {
      let baseQuery = queryBuilder().aggregations([{name: 'property1'}, {name: 'property2'}]).query();
      let property1Aggregation = {
        terms: {
          field: 'doc.metadata.property1.raw',
          size: 0
        },
        aggregations: {
          filtered: {
            filter: {
              bool: {
                must: []
              }
            }
          }
        }
      };

      expect(baseQuery.aggregations.property1).toEqual(property1Aggregation);
    });
  });

  describe('fullTextSearch', () => {
    it('should do a multi_match on default fields', () => {
      let baseQuery = queryBuilder().fullTextSearch('term').query();
      expect(baseQuery.query.bool.must[1]).toEqual(
        {
          multi_match: {
            query: 'term',
            type: 'phrase_prefix',
            fields: ['doc.fullText', 'doc.title']
          }
        }
      );
    });

    describe('sort', () => {
      it('should add a sort property desc by default', () => {
        let baseQuery = queryBuilder().sort('title').query();
        expect(baseQuery.sort[0]).toEqual({'doc.title.raw': {order: 'desc', ignore_unmapped: true}});
      });
      it('should sort by order passed', () => {
        let baseQuery = queryBuilder().sort('title', 'asc').query();
        expect(baseQuery.sort[0]).toEqual({'doc.title.raw': {order: 'asc', ignore_unmapped: true}});
      });
    });

    describe('when passing fields', () => {
      it('should use them instead of the default ones', () => {
        let baseQuery = queryBuilder().fullTextSearch('term', ['another.field']).query();
        expect(baseQuery.query.bool.must[1]).toEqual({
          multi_match: {
            query: 'term',
            type: 'phrase_prefix',
            fields: ['another.field']
          }
        });
      });
    });
  });

  describe('highlights', () => {
    it('should return a query with hilight configuration for the fields passed', () => {
      let baseQuery = queryBuilder().highlight(['field1', 'field2']).query();
      expect(baseQuery.highlight.fields).toEqual({
        field1: {},
        field2: {}
      });
    });
  });
});
