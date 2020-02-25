import { catchErrors } from 'api/utils/jasmineHelpers';

import instrumentRoutes from '../../utils/instrumentRoutes';
import pages from '../pages';
import pagesRoutes from '../routes.js';

describe('Pages Routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(pagesRoutes);
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: { title: 'Batman begins' },
        user: { username: 'admin' },
        language: 'lang',
      };
    });

    it('should need authorization', () => {
      expect(routes.post('/api/pages', req)).toNeedAuthorization();
    });

    it('should create a new document with current user', done => {
      spyOn(pages, 'save').and.returnValue(new Promise(resolve => resolve('document')));
      routes
        .post('/api/pages', req)
        .then(document => {
          expect(document).toBe('document');
          expect(pages.save).toHaveBeenCalledWith(req.body, req.user, 'lang');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('/api/pages', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/pages')).toMatchSnapshot();
    });

    it('should ask pages model for the page in the current locale', done => {
      const req = {
        query: { sharedId: '123' },
        language: 'es',
      };
      spyOn(pages, 'get').and.returnValue(Promise.resolve('page'));
      routes
        .get('/api/pages', req)
        .then(response => {
          expect(pages.get).toHaveBeenCalledWith({ sharedId: '123', language: 'es' });
          expect(response).toBe('page');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('/api/page', () => {
    it('should ask pages model for the page in the current locale', done => {
      const req = {
        query: { sharedId: '123' },
        language: 'es',
      };
      spyOn(pages, 'getById').and.returnValue(Promise.resolve('page'));
      routes
        .get('/api/page', req)
        .then(response => {
          expect(pages.getById).toHaveBeenCalledWith('123', 'es');
          expect(response).toBe('page');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('GET', () => {
    describe('/api/pages', () => {
      it('should have a validation schema', () => {
        expect(routes.get.validation('/api/pages')).toMatchSnapshot();
      });
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      spyOn(pages, 'delete').and.returnValue(Promise.resolve({ json: 'ok' }));
    });

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/pages')).toMatchSnapshot();
    });

    it('should use pages to delete it', done => {
      const req = { query: { _id: 123, _rev: 456, sharedId: '456' } };
      return routes
        .delete('/api/pages', req)
        .then(() => {
          expect(pages.delete).toHaveBeenCalledWith(req.query.sharedId);
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
