"use strict";require("../../utils/jasmineHelpers");

var _odm = require("../../odm");
var _entities = _interopRequireDefault(require("../../entities"));
var _search = _interopRequireDefault(require("../../search/search"));

var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _routes = _interopRequireDefault(require("../routes.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('sync', () => {
  let routes;
  let req;
  let dataObject;

  const setReqDefault = (property, type = 'object') => {
    req = {};
    dataObject = { _id: 'dataId' };
    req[property] = { namespace: 'model1', data: type === 'string' ? JSON.stringify(dataObject) : dataObject };
  };

  beforeEach(async () => {
    jest.mock("../../auth");
    routes = (0, _instrumentRoutes.default)(_routes.default);
    _odm.models.model1 = {
      save: jasmine.createSpy('model1.save'),
      delete: jasmine.createSpy('model1.delete') };


    _odm.models.model2 = {
      save: jasmine.createSpy('model2.save'),
      delete: jasmine.createSpy('model2.delete') };

    spyOn(_search.default, 'delete');
    spyOn(_entities.default, 'indexEntities');
  });

  describe('POST', () => {
    beforeEach(() => {
      setReqDefault('body');
    });

    it('should need authorization', () => {
      expect(routes._post('/api/sync', {})).toNeedAuthorization();
    });

    it('should save on the namespaced model', async () => {
      const response = await routes.post('/api/sync', req);
      expect(_odm.models.model1.save).toHaveBeenCalledWith(dataObject);
      expect(response).toBe('ok');

      req.body.namespace = 'model2';
      await routes.post('/api/sync', req);
      expect(_odm.models.model2.save).toHaveBeenCalledWith(dataObject);
      expect(_entities.default.indexEntities).not.toHaveBeenCalled();
    });

    describe('on error', () => {
      it('should call next', async () => {
        _odm.models.model1.save.and.returnValue(Promise.reject(new Error('error')));
        try {
          await routes.post('/api/sync', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });

    describe('when namespace is entities', () => {
      it('should index on elastic', async () => {
        _odm.models.entities = {
          save: jasmine.createSpy('entities.save'),
          delete: jasmine.createSpy('entities.delete') };


        req.body = {
          namespace: 'entities',
          data: { _id: 'id' } };


        await routes.post('/api/sync', req);
        expect(_entities.default.indexEntities).toHaveBeenCalledWith({ _id: 'id' }, '+fullText');
      });
    });

    describe('when namespace is settings', () => {
      it('should replace the incomming id with the local id', async () => {
        _odm.models.settings = {
          save: jasmine.createSpy('settings.save'),
          get: () => Promise.resolve([{ _id: 'slaveId' }]) };


        req.body = {
          namespace: 'settings',
          data: { _id: 'masterId', languages: 'ln' } };


        await routes.post('/api/sync', req);
        expect(_odm.models.settings.save).toHaveBeenCalledWith({ _id: 'slaveId', languages: 'ln' });
      });
    });

    describe('sync/upload', () => {
      it('should need authorization', () => {
        expect(routes._post('/api/sync/upload', {})).toNeedAuthorization();
      });
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      setReqDefault('query', 'string');
    });

    it('should need authorization', () => {
      expect(routes._delete('/api/sync', {})).toNeedAuthorization();
    });

    it('should remove on the namespaced model', async () => {
      const response = await routes.delete('/api/sync', req);
      expect(_odm.models.model1.delete).toHaveBeenCalledWith(dataObject);
      expect(response).toBe('ok');

      req.query.namespace = 'model2';
      await routes.delete('/api/sync', req);
      expect(_odm.models.model2.delete).toHaveBeenCalledWith(dataObject);
      expect(_search.default.delete).not.toHaveBeenCalled();
    });

    describe('on error', () => {
      it('should call next if model fails', async () => {
        _odm.models.model1.delete.and.returnValue(Promise.reject(new Error('error')));
        try {
          await routes.delete('/api/sync', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });

    describe('when namespace is entities', () => {
      beforeEach(() => {
        _odm.models.entities = {
          save: jasmine.createSpy('entities.save'),
          delete: jasmine.createSpy('entities.delete') };


        req.query = {
          namespace: 'entities',
          data: JSON.stringify({ _id: 'id' }) };

      });

      it('should delete it from elastic', async () => {
        await routes.delete('/api/sync', req);
        expect(_search.default.delete).toHaveBeenCalledWith({ _id: 'id' });
      });

      it('should call next if elastic fails', async () => {
        _search.default.delete.and.returnValue(Promise.reject(new Error('error')));
        try {
          await routes.delete('/api/sync', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });

      it('should not fail if elastic path has already been deleted (statusCode 404)', async () => {
        const error = new Error('Not Found :: 404');
        error.statusCode = 404;

        _search.default.delete.and.returnValue(Promise.reject(error));
        const response = await routes.delete('/api/sync', req);
        expect(response).toBe('ok');
      });
    });
  });
});