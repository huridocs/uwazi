import documentRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import documents from '../documents';
import templates from '../../templates';
import {catchErrors} from 'api/utils/jasmineHelpers';

import fixtures, {batmanFinishesId} from './fixtures.js';
import db from 'api/utils/testing_db';

describe('documents', () => {
  let routes;

  beforeEach((done) => {
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
    routes = instrumentRoutes(documentRoutes);
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('POST', () => {
    let req;

    beforeEach(() => {
      req = {
        body: {title: 'Batman begins'},
        user: {_id: db.id(), username: 'admin'},
        language: 'es'
      };
    });

    it('should need authorization', () => {
      spyOn(documents, 'save').and.returnValue(new Promise((resolve) => resolve('document')));
      expect(routes.post('/api/documents', req)).toNeedAuthorization();
    });

    it('should create a new document with current user', (done) => {
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
    it('should download the document with the originalname as file name', (done) => {
      let req = {query: {_id: batmanFinishesId}};
      let res = {download: jasmine.createSpy('download')};

      routes.get('/api/documents/download', req, res)
      .then(() => {
        expect(res.download).toHaveBeenCalledWith(jasmine.any(String), 'Batman original.pdf');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
