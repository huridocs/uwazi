import documents from '../documents.js';
import elastic from '../elastic';
import elasticResult from './elasticResult';
import buildQuery from '../elasticQuery';

describe('documents', () => {
  let result;
  beforeEach(() => {
    result = elasticResult().withDocs([
      {title: 'doc1', _id: 'id1'},
      {title: 'doc2', _id: 'id2'}
    ]).toObject();
  });

  describe('search', () => {
    it('should perform a search on all fields', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      documents.search('searchTerm')
      .then((results) => {
        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: buildQuery('searchTerm')});
        expect(results).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
        done();
      });
    });

    describe('when searchTerm is blank', () => {
      it('should match all', (done) => {
        spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
        documents.search('')
        .then((results) => {
          expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: buildQuery('')});
          expect(results).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
          done();
        });
      });
    });
  });

  describe('matchTitle', () => {
    it('should perform a search by title with highlighted titles', (done) => {
      result = elasticResult().withDocs([
        {title: 'doc1', _id: 'id1'},
        {title: 'doc2', _id: 'id2'}
      ])
      .withHighlights([{'doc.title': ['doc1 highlighted']}, {'doc.title': ['doc2 highlighted']}])
      .toObject();
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));

      documents.matchTitle('term')
      .then((results) => {
        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: buildQuery('term', ['doc.title'], ['doc.title'], 5)});
        expect(results).toEqual([{_id: 'id1', title: 'doc1 highlighted'}, {_id: 'id2', title: 'doc2 highlighted'}]);
        done();
      })
      .catch(done.fail);
    });
  });
});
