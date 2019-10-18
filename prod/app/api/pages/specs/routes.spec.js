"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");

var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _pages = _interopRequireDefault(require("../pages"));
var _routes = _interopRequireDefault(require("../routes.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Pages Routes', () => {
  let routes;

  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: { title: 'Batman begins' },
        user: { username: 'admin' },
        language: 'lang' };

    });

    it('should need authorization', () => {
      expect(routes.post('/api/pages', req)).toNeedAuthorization();
    });

    it('should create a new document with current user', done => {
      spyOn(_pages.default, 'save').and.returnValue(new Promise(resolve => resolve('document')));
      routes.post('/api/pages', req).
      then(document => {
        expect(document).toBe('document');
        expect(_pages.default.save).toHaveBeenCalledWith(req.body, req.user, 'lang');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('/api/pages', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/pages')).toMatchSnapshot();
    });

    it('should ask pages model for the page in the current locale', done => {
      const req = {
        query: { sharedId: '123' },
        language: 'es' };

      spyOn(_pages.default, 'get').and.returnValue(Promise.resolve('page'));
      routes.get('/api/pages', req).
      then(response => {
        expect(_pages.default.get).toHaveBeenCalledWith({ sharedId: '123', language: 'es' });
        expect(response).toBe('page');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('/api/page', () => {
    it('should ask pages model for the page in the current locale', done => {
      const req = {
        query: { sharedId: '123' },
        language: 'es' };

      spyOn(_pages.default, 'getById').and.returnValue(Promise.resolve('page'));
      routes.get('/api/page', req).
      then(response => {
        expect(_pages.default.getById).toHaveBeenCalledWith('123', 'es');
        expect(response).toBe('page');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
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
      spyOn(_pages.default, 'delete').and.returnValue(Promise.resolve({ json: 'ok' }));
    });

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/pages')).toMatchSnapshot();
    });

    it('should use pages to delete it', done => {
      const req = { query: { _id: 123, _rev: 456, sharedId: '456' } };
      return routes.delete('/api/pages', req).
      then(() => {
        expect(_pages.default.delete).toHaveBeenCalledWith(req.query.sharedId);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});