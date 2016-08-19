import documentRoutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
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
    it('should return documents.get', (done) => {
      spyOn(documents, 'get').and.returnValue(new Promise((resolve) => resolve('documents')));
      routes.get('/api/documents')
      .then((response) => {
        expect(response).toBe('documents');
        done();
      })
      .catch(console.log);
    });

    describe('when passing id', () => {
      it('should pass the id to documents.get', (done) => {
        spyOn(documents, 'get').and.returnValue(new Promise((resolve) => resolve('documents')));
        let req = {query: {_id: '8202c463d6158af8065022d9b5014ccb'}};

        routes.get('/api/documents', req)
        .then(() => {
          expect(documents.get).toHaveBeenCalledWith(req.query._id);
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
      let fields = JSON.stringify(['field1', 'field2']);
      let req = {query: {searchTerm: 'test', filters: filtersValue, types, fields}};

      routes.get('/api/documents/search', req)
      .then((response) => {
        expect(documents.search).toHaveBeenCalledWith(
          {searchTerm: 'test', filters: {property: 'property'}, types: ['ruling', 'judgement'], fields: ['field1', 'field2']}
        );
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
    beforeEach(() => {
      spyOn(documents, 'delete').and.returnValue(Promise.resolve({json: 'ok'}));
    });

    it('should use documents to delete it', (done) => {
      let req = {query: {_id: 123, _rev: 456}};
      return routes.delete('/api/documents', req)
      .then(() => {
        expect(documents.delete).toHaveBeenCalledWith(req.query._id);
        done();
      })
      .catch(done.fail);
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

  describe('/download', () => {
    it('should download the document with the titile as file name', (done) => {
      let req = {query: {_id: '8202c463d6158af8065022d9b5014a18'}};
      let res = {};

      routes.get('/api/documents/download', req, res)
      .then(() => {
        expect(res.download).toHaveBeenCalledWith(jasmine.any(String), 'Batman finishes.pdf');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
