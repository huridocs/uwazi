import pagesRoutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import pages from '../pages';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('Pages Routes', () => {
  let routes;

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
    routes = instrumentRoutes(pagesRoutes);
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: {title: 'Batman begins'},
        user: {_id: 'c08ef2532f0bd008ac5174b45e033c93', username: 'admin'},
        language: 'lang'
      };
    });

    it('should need authorization', () => {
      expect(routes.post('/api/pages', req)).toNeedAuthorization();
    });

    it('should create a new document with use user', (done) => {
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
    it('should ask pages model for the page in the current locale', (done) => {
      let req = {
        query: {sharedId: '123'},
        language: 'es'
      };
      spyOn(pages, 'get').and.returnValue(Promise.resolve('page'));
      routes.get('/api/pages', req)
      .then((response) => {
        expect(pages.get).toHaveBeenCalledWith('123', 'es');
        expect(response).toBe('page');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/pages/list', () => {
    it('return the list from pages passing the keys', (done) => {
      let req = {
        language: 'es'
      };

      spyOn(pages, 'list').and.returnValue(new Promise((resolve) => resolve('document')));
      routes.get('/api/pages/list', req)
      .then((document) => {
        expect(document).toBe('document');
        expect(pages.list).toHaveBeenCalledWith('es');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      spyOn(pages, 'delete').and.returnValue(Promise.resolve({json: 'ok'}));
    });

    it('should use pages to delete it', (done) => {
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
