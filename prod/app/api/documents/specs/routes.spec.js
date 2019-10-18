"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));

var _routes = _interopRequireDefault(require("../routes.js"));
var _documents = _interopRequireDefault(require("../documents"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _templates = _interopRequireDefault(require("../../templates"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('documents', () => {
  let routes;

  beforeEach(done => {
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
    routes = (0, _instrumentRoutes.default)(_routes.default);
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('POST', () => {
    let req;

    beforeEach(() => {
      req = {
        body: { title: 'Batman begins' },
        user: { _id: _testing_db.default.id(), username: 'admin' },
        language: 'es' };

    });

    it('should need authorization', () => {
      spyOn(_documents.default, 'save').and.returnValue(new Promise(resolve => resolve('document')));
      expect(routes.post('/api/documents', req)).toNeedAuthorization();
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/documents')).toMatchSnapshot();
    });

    it('should create a new document with current user', done => {
      spyOn(_documents.default, 'save').and.returnValue(new Promise(resolve => resolve('document')));
      routes.post('/api/documents', req).
      then(document => {
        expect(document).toBe('document');
        expect(_documents.default.save).toHaveBeenCalledWith(req.body, { user: req.user, language: req.language });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('/api/documents', () => {
    beforeEach(() => {
      spyOn(_documents.default, 'getById').and.returnValue(new Promise(resolve => resolve('documents')));
    });
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/documents')).toMatchSnapshot();
    });
    it('should return documents.get', done => {
      const req = { query: { _id: 'id' }, language: 'es' };
      routes.get('/api/documents', req).
      then(response => {
        expect(_documents.default.getById).toHaveBeenCalledWith(req.query._id, req.language);
        expect(response).toEqual({ rows: ['documents'] });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('/api/documents/count_by_template', () => {
    beforeEach(() => {
      spyOn(_templates.default, 'countByTemplate').and.returnValue(new Promise(resolve => resolve(2)));
    });
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/documents/count_by_template')).toMatchSnapshot();
    });
    it('should return count of documents using a specific template', done => {
      const req = { query: { templateId: 'templateId' } };

      routes.get('/api/documents/count_by_template', req).
      then(response => {
        expect(_templates.default.countByTemplate).toHaveBeenCalledWith('templateId');
        expect(response).toEqual(2);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      spyOn(_documents.default, 'delete').and.returnValue(Promise.resolve({ json: 'ok' }));
    });

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/documents')).toMatchSnapshot();
    });

    it('should use documents to delete it', done => {
      const req = { query: { sharedId: 123, _rev: 456 } };
      return routes.delete('/api/documents', req).
      then(() => {
        expect(_documents.default.delete).toHaveBeenCalledWith(req.query.sharedId);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('/download', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/documents/download')).toMatchSnapshot();
    });

    it('should download the document with the originalname as file name', done => {
      const req = { query: { _id: _fixtures.batmanFinishesId } };
      const res = { download: jasmine.createSpy('download') };

      routes.get('/api/documents/download', req, res).
      then(() => {
        expect(res.download).toHaveBeenCalledWith(jasmine.any(String), 'Batman original.pdf');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when document does not exist', () => {
      it('should throw a 404 error', done => {
        const nonExistent = _testing_db.default.id();
        const req = { query: { _id: nonExistent } };

        routes.get('/api/documents/download', req).
        then(() => {
          done.fail('should throw a 404');
        }).
        catch(e => {
          expect(e.code).toBe(404);
          done();
        });
      });
    });
  });
});