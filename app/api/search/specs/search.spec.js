import search from '../search.js';
import elastic from '../elastic';
import elasticResult from './elasticResult';
import queryBuilder from 'api/search/documentQueryBuilder';
import {catchErrors} from 'api/utils/jasmineHelpers';

import fixtures, {templateId, userId, unpublishedId} from './fixtures.js';
import {db} from 'api/utils';

describe('search', () => {
  let result;
  beforeEach((done) => {
    result = elasticResult().withDocs([
      {title: 'doc1', _id: 'id1'},
      {title: 'doc2', _id: 'id2'}
    ])
    .toObject();

    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('countByTemplate', () => {
    it('should return how many entities or documents are using the template passed', (done) => {
      search.countByTemplate(templateId)
      .then((count) => {
        expect(count).toBe(4);
        done();
      })
      .catch(done.fail);
    });

    it('should return 0 when no count found', (done) => {
      const newTemplate = db.id();
      search.countByTemplate(newTemplate)
      .then((count) => {
        expect(count).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getUploadsByUser', () => {
    it('should request all unpublished entities or documents for the user', (done) => {
      let user = {_id: userId};
      search.getUploadsByUser(user, 'en')
      .then((response) => {
        expect(response.length).toBe(1);
        expect(response[0].title).toBe('unpublished');
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

    it('should allow searching only within specific Ids', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      search.search({
        searchTerm: 'searchTerm',
        ids: ['1', '3']
      }, 'es')
      .then((results) => {
        const expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm')
        .filterById(['1', '3'])
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
        .sort('title', 'asc')
        .query();

        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: expectedQuery});
        expect(results.rows).toEqual([{_id: 'id1', title: 'doc1'}, {_id: 'id2', title: 'doc2'}]);
        done();
      });
    });

    it('should allow including unpublished documents', (done) => {
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));
      search.search({
        searchTerm: 'searchTerm',
        includeUnpublished: true
      }, 'es')
      .then((results) => {
        let expectedQuery = queryBuilder()
        .fullTextSearch('searchTerm')
        .includeUnpublished()
        .language('es')
        .query();

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
      .withHighlights([{title: ['doc1 highlighted']}, {title: ['doc2 highlighted']}])
      .toObject();
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));

      search.matchTitle('term', 'es')
      .then((results) => {
        let query = queryBuilder().fullTextSearch('term', ['title']).highlight(['title']).language('es').limit(5).query();
        expect(elastic.search).toHaveBeenCalledWith({index: 'uwazi', body: query});
        expect(results).toEqual([{_id: 'id1', title: 'doc1 highlighted'}, {_id: 'id2', title: 'doc2 highlighted'}]);
        done();
      })
      .catch(done.fail);
    });

    it('should return empty array if searchTerm is empty and not an error', (done) => {
      result = elasticResult().withDocs([
        {title: 'doc1', _id: 'id1'},
        {title: 'doc2', _id: 'id2'}
      ])
      .toObject();
      spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => resolve(result)));

      search.matchTitle('', 'es')
      .then((results) => {
        expect(results).toEqual([]);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('index', () => {
    it('should index the document', (done) => {
      spyOn(elastic, 'index').and.returnValue(Promise.resolve());

      const entity = {
        _id: 'asd1',
        _rev: '1-a3fs',
        type: 'document',
        title: 'Batman indexes'
      };

      search.index(entity)
      .then(() => {
        expect(elastic.index)
        .toHaveBeenCalledWith({index: 'uwazi', type: 'entity', id: 'asd1', body: {
          type: 'document',
          title: 'Batman indexes'
        }});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete', () => {
    it('should delete the index', (done) => {
      spyOn(elastic, 'delete').and.returnValue(Promise.resolve());

      const id = db.id();

      const entity = {
        _id: id,
        type: 'document',
        title: 'Batman indexes'
      };

      search.delete(entity)
      .then(() => {
        expect(elastic.delete)
        .toHaveBeenCalledWith({index: 'uwazi', type: 'entity', id: id.toString()});
        done();
      })
      .catch(done.fail);
    });
  });
});
