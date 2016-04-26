import queryBuilder from 'api/documents/documentQueryBuilder';

describe('documentQueryBuilder', () => {
  beforeEach(() => {});

  describe('default query', () => {
    it('should do a match all on published documents', () => {
      expect(queryBuilder().query().query).toEqual({match_all: {}});
      expect(queryBuilder().query().filter.bool.must[0]).toEqual({"match":{"doc.published": true}});
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

  describe('fullTextSearch', () => {
    it('should do a multi_match on default fields', () => {
      let query = queryBuilder().fullTextSearch('term').query();
      expect(query.query).toEqual({
        multi_match: {
          query: 'term',
          type: 'phrase_prefix',
          fields: ['doc.fullText', 'doc.metadata.*', 'doc.title']
        }
      });
    });

    describe('when term is blank', () => {
      it('should return the default match_all', () => {
        let query = queryBuilder().fullTextSearch('').query();
        expect(query.query).toEqual({match_all: {}});
      });
    });

    describe('when passing fields', () => {
      it('should use passed fields instead of the default ones', () => {
        let query = queryBuilder().fullTextSearch('term', ['another.field']).query();
        expect(query.query).toEqual({
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
      let query = queryBuilder().highlight(['field1', 'field2']).query();
      expect(query.highlight.fields).toEqual({
        field1: {},
        field2: {}
      });
    });
  });
});
