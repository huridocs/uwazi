import pagesRoutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import pages from '../pages';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('Pages Routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(pagesRoutes);
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: {title: 'Batman begins'},
        user: {username: 'admin'},
        language: 'lang'
      };
    });

    fit('should need authorization', () => {
      expect(routes.post('/api/pages', req)).toNeedAuthorization();
    });

    fit('should create a new document with current user', (done) => {
      spyOn(pages, 'save').and.returnValue(new Promise((resolve) => resolve('document')));
      routes.post('/api/pages', req)
      .then((document) => {
        expect(document).toBe('document');
        expect(pages.save).toHaveBeenCalledWith(req.body, req.user, 'lang');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/pages', () => {
    fit('should ask pages model for the page in the current locale', (done) => {
      let req = {
        query: {sharedId: '123'},
        language: 'es'
      };
      spyOn(pages, 'getById').and.returnValue(Promise.resolve('page'));
      routes.get('/api/pages', req)
      .then((response) => {
        expect(pages.getById).toHaveBeenCalledWith('123', 'es');
        expect(response).toBe('page');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/pages/list', () => {
    fit('return the list from pages passing the keys', (done) => {
      let req = {
        language: 'es'
      };

      spyOn(pages, 'get').and.returnValue(new Promise((resolve) => resolve('document')));
      routes.get('/api/pages/list', req)
      .then((document) => {
        expect(document).toBe('document');
        expect(pages.get).toHaveBeenCalledWith({language: 'es'});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      spyOn(pages, 'delete').and.returnValue(Promise.resolve({json: 'ok'}));
    });

    fit('should use pages to delete it', (done) => {
      let req = {query: {_id: 123, _rev: 456, sharedId: '456'}};
      return routes.delete('/api/pages', req)
      .then(() => {
        expect(pages.delete).toHaveBeenCalledWith(req.query.sharedId);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
