import documents from '../documents.js';
import elastic from '../elastic';
import elasticResult from './elasticResult';

describe('documents', () => {
  let buildQuery = (searchTerm) => {
    let query = {match_all: {}};
    if (searchTerm) {
      query = {
        multi_match: {
          query: searchTerm,
          type: 'phrase_prefix',
          fields: ['doc.fullText', 'doc.metadata.*', 'doc.title']
        }
      };
    }
    return {
      _source: {
        include: [ 'doc.title', 'doc.processed']
      },
      from: 0,
      size: 100,
      query: query,
      filter: {
        term: {'doc.published': true}
      }
    };
  };

  beforeEach(() => {
    let result = elasticResult().withDocs([
      {title: 'doc1', _id: 'id1'},
      {title: 'doc2', _id: 'id2'}
    ]).toObject();
    spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
  });

  describe('search', () => {
    it('should perform a search on all fields', (done) => {
      documents.search('searchTerm')
      .then((results) => {
        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: buildQuery('searchTerm')});
        expect(results).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
        done();
      });
    });

    describe('when searchTerm is blank', () => {
      it('should match all', (done) => {
        documents.search('')
        .then((results) => {
          expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: buildQuery('')});
          expect(results).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
          done();
        });
      });
    });
  });
});
