import documentRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import documents from '../documents';
import templates from '../../templates';
import {catchErrors} from 'api/utils/jasmineHelpers';

import fixtures, {batmanFinishesId} from './fixtures.js';
import {db} from 'api/utils';

describe('documents', () => {
  let routes;

  beforeEach((done) => {
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
    routes = instrumentRoutes(documentRoutes);
  });

  describe('POST', () => {
    let req;

    beforeEach(() => {
      req = {
        body: {title: 'Batman begins'},
        user: {_id: 'c08ef2532f0bd008ac5174b45e033c93', username: 'admin'},
        language: 'es'
      };
    });

    it('should need authorization', () => {
      expect(routes.post('/api/documents', req)).toNeedAuthorization();
    });

    it('should create a new document with use user', (done) => {
      spyOn(documents, 'save').and.returnValue(new Promise((resolve) => resolve('document')));
      routes.post('/api/documents', req)
      .then((document) => {
        expect(document).toBe('document');
        expect(documents.save).toHaveBeenCalledWith(req.body, {user: req.user, language: req.language});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/documents', () => {
    it('should return documents.get', (done) => {
      let req = {query: {_id: 'id'}, language: 'es'};
      spyOn(documents, 'getById').and.returnValue(new Promise((resolve) => resolve('documents')));
      routes.get('/api/documents', req)
      .then((response) => {
        expect(documents.getById).toHaveBeenCalledWith(req.query._id, req.language);
        expect(response).toEqual({rows: ['documents']});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  xdescribe('/api/documents/html', () => {
    it('should get the thml conversion', (done) => {
      spyOn(documents, 'getHTML').and.returnValue(new Promise((resolve) => resolve('html')));
      let req = {query: {_id: 'test'}, language: 'es'};

      routes.get('/api/documents/html', req)
      .then((response) => {
        expect(response).toEqual('html');
        expect(documents.getHTML).toHaveBeenCalledWith('test', 'es');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/documents/count_by_template', () => {
    it('should return count of documents using a specific template', (done) => {
      spyOn(templates, 'countByTemplate').and.returnValue(new Promise((resolve) => resolve(2)));
      let req = {query: {templateId: 'templateId'}};

      routes.get('/api/documents/count_by_template', req)
      .then((response) => {
        expect(templates.countByTemplate).toHaveBeenCalledWith('templateId');
        expect(response).toEqual(2);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      spyOn(documents, 'delete').and.returnValue(Promise.resolve({json: 'ok'}));
    });

    it('should use documents to delete it', (done) => {
      let req = {query: {sharedId: 123, _rev: 456}};
      return routes.delete('/api/documents', req)
      .then(() => {
        expect(documents.delete).toHaveBeenCalledWith(req.query.sharedId);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/download', () => {
    it('should download the document with the titile as file name', (done) => {
      let req = {query: {_id: batmanFinishesId}};
      let res = {download: jasmine.createSpy('download')};

      routes.get('/api/documents/download', req, res)
      .then(() => {
        expect(res.download).toHaveBeenCalledWith(jasmine.any(String), 'Batman finishes.pdf');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
