import documentRoutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import request from '../../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../../config/database.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import documents from '../documents';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('documents', () => {
  let routes;

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
    routes = instrumentRoutes(documentRoutes);
  });

  describe('POST', () => {
    it('should need authorization', () => {
      expect(routes.post('/api/documents')).toNeedAuthorization();
    });

    it('should create a new document with use user', (done) => {
      let req = {
        body: {title: 'Batman begins'},
        user: {_id: 'c08ef2532f0bd008ac5174b45e033c93', username: 'admin'}
      };

      spyOn(documents, 'save').and.returnValue(new Promise((resolve) => resolve('document')));
      routes.post('/api/documents', req)
      .then((document) => {
        expect(document).toBe('document');
        expect(documents.save).toHaveBeenCalledWith(req.body, req.user);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('/api/documents', () => {
    it('should return a list of documents returned from the list view', (done) => {
      routes.get('/api/documents')
      .then((response) => {
        expect(response.rows.length).toBe(7);
        expect(response.rows[0].title).toEqual('Batman finishes');
        expect(response.rows[0]._id).toEqual('8202c463d6158af8065022d9b5014a18');
        done();
      })
      .catch(console.log);
    });

    describe('when passing id', () => {
      it('should return matching document', (done) => {
        let req = {query: {_id: '8202c463d6158af8065022d9b5014ccb'}};

        routes.get('/api/documents', req)
        .then((response) => {
          let docs = response.rows;
          expect(docs.length).toBe(1);
          expect(docs[0].title).toBe('Penguin almost done');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('/api/documents/list', () => {
    it('return the list from documents passing the keys', (done) => {
      let req = {
        query: {keys: JSON.stringify(['1', '2'])}
      };

      spyOn(documents, 'list').and.returnValue(new Promise((resolve) => resolve('document')));
      routes.get('/api/documents/list', req)
      .then((document) => {
        expect(document).toBe('document');
        expect(documents.list).toHaveBeenCalledWith(['1', '2']);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('/api/documents/html', () => {
    it('should get the thml conversion', (done) => {
      spyOn(documents, 'getHTML').and.returnValue(new Promise((resolve) => resolve('html')));
      let req = {query: {_id: 'test'}};

      routes.get('/api/documents/html', req)
      .then((response) => {
        expect(response).toEqual('html');
        expect(documents.getHTML).toHaveBeenCalledWith('test');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('/api/documents/count_by_template', () => {
    it('should return count of documents using a specific template', (done) => {
      spyOn(documents, 'countByTemplate').and.returnValue(new Promise((resolve) => resolve(2)));
      let req = {query: {templateId: 'templateId'}};

      routes.get('/api/documents/count_by_template', req)
      .then((response) => {
        expect(documents.countByTemplate).toHaveBeenCalledWith('templateId');
        expect(response).toEqual(2);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('/api/documents/search', () => {
    it('should search documents and return the results', (done) => {
      spyOn(documents, 'search').and.returnValue(new Promise((resolve) => resolve('results')));
      let filtersValue = JSON.stringify({property: 'property'});
      let types = JSON.stringify(['ruling', 'judgement']);
      let req = {query: {searchTerm: 'test', filters: filtersValue, types}};

      routes.get('/api/documents/search', req)
      .then((response) => {
        expect(documents.search).toHaveBeenCalledWith({searchTerm: 'test', filters: {property: 'property'}, types: ['ruling', 'judgement']});
        expect(response).toEqual('results');
        done();
      })
      .catch(done.fail);
    });

    describe('when has no filters or types', () => {
      it('should search documents and return the results', (done) => {
        spyOn(documents, 'search').and.returnValue(new Promise((resolve) => resolve('results')));
        let req = {query: {}};

        routes.get('/api/documents/search', req)
        .then((response) => {
          expect(documents.search).toHaveBeenCalledWith({});
          expect(response).toEqual('results');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('/api/documents/match_title', () => {
    it('should search documents by title and return the results', (done) => {
      spyOn(documents, 'matchTitle').and.returnValue(new Promise((resolve) => resolve('results')));
      let req = {query: {searchTerm: 'test'}};

      routes.get('/api/documents/match_title', req)
      .then((response) => {
        expect(response).toEqual('results');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('DELETE', () => {
    it('should delete a document', (done) => {
      request.get(dbUrl + '/8202c463d6158af8065022d9b5014ccb')
      .then(template => {
        let req = {query: {_id: template.json._id, _rev: template.json._rev}};
        return routes.delete('/api/documents', req);
      })
      .then((response) => {
        expect(response.ok).toBe(true);
        return request.get(dbUrl + '/_design/documents/_view/all');
      })
      .then((response) => {
        let docs = response.json.rows;
        expect(docs.length).toBe(6);
        expect(docs[0].value.title).toBe('Batman finishes');
        done();
      })
      .catch(done.fail);
    });

    describe('when there is a db error', () => {
      it('return the error in the response', (done) => {
        let req = {query: {_id: '8202c463d6158af8065022d9b5014ccb', _rev: 'bad_rev'}};

        routes.delete('/api/documents', req)
        .then((response) => {
          expect(response.error.error).toBe('bad_request');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('/uploads', () => {
    it('should need authorization', () => {
      expect(routes.get('/api/documents/uploads')).toNeedAuthorization();
    });

    it('should return documents.uploadsByUser', (done) => {
      spyOn(documents, 'getUploadsByUser').and.returnValue(new Promise((resolve) => resolve('results')));
      let req = {user: {_id: 'c08ef2532f0bd008ac5174b45e033c94'}};

      routes.get('/api/documents/uploads', req)
      .then((response) => {
        expect(response).toBe('results');
        expect(documents.getUploadsByUser).toHaveBeenCalledWith(req.user);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
