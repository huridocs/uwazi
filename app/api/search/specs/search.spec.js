import search from '../search.js';
import elastic from '../elastic';
import elasticResult from './elasticResult';
import database from 'api/utils/database.js';
import fixtures from './fixtures.js';
import queryBuilder from 'api/search/documentQueryBuilder';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('search', () => {
  let result;
  beforeEach((done) => {
    result = elasticResult().withDocs([
      {title: 'doc1', _id: 'id1'},
      {title: 'doc2', _id: 'id2'}
    ]).toObject();

    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(catchErrors(done));
  });

  describe('countByTemplate', () => {
    it('should return how many entities or documents are using the template passed', (done) => {
      search.countByTemplate('template1')
      .then((count) => {
        expect(count).toBe(2);
        done();
      })
      .catch(done.fail);
    });

    it('should return 0 when no count found', (done) => {
      search.countByTemplate('newTemplate')
      .then((count) => {
        expect(count).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getUploadsByUser', () => {
    it('should request all unpublished entities or documents for the user', (done) => {
      let user = {_id: 'c08ef2532f0bd008ac5174b45e033c94'};
      search.getUploadsByUser(user, 'es')
      .then((response) => {
        expect(response.rows.length).toBe(1);
        expect(response.rows[0].title).toBe('unpublished');
        expect(response.rows[0]._id).toBe('d0298a48d1221c5ceb53c4879301508f');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('search', () => {
    it('should perform a search on all fields', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      search.search({
        searchTerm: 'searchTerm',
        filters: {property1: 'value1', property2: 'value2'},
        fields: ['field'],
        types: ['ruling']
      }, 'es')
      .then((results) => {
        let expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm', ['field'])
        .filterMetadata({property1: 'value1', property2: 'value2'})
        .filterByTemplate(['ruling'])
        .language('es')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: expectedQuery});
        expect(results.rows).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
        expect(results.totalRows).toEqual(10);
        done();
      });
    });

    it('should sort if sort is present', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      search.search({
        searchTerm: 'searchTerm',
        filters: {property1: 'value1', property2: 'value2'},
        sort: 'title',
        order: 'asc',
        types: ['ruling']
      }, 'es')
      .then((results) => {
        let expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm')
        .filterMetadata({property1: 'value1', property2: 'value2'})
        .filterByTemplate(['ruling'])
        .language('es')
        .sort('title', 'asc').query();

        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: expectedQuery});
        expect(results.rows).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
        done();
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

      search.matchTitle('term')
      .then((results) => {
        let query = queryBuilder().fullTextSearch('term', ['doc.title']).highlight(['doc.title']).limit(5).query();
        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: query});
        expect(results).toEqual([{_id: 'id1', title: 'doc1 highlighted'}, {_id: 'id2', title: 'doc2 highlighted'}]);
        done();
      })
      .catch(done.fail);
    });
  });
});
