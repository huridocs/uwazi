import 'api/utils/jasmineHelpers';

import { models } from 'api/odm';
import search from 'api/search/search';

import instrumentRoutes from '../../utils/instrumentRoutes';
import syncRoutes from '../routes.js';

describe('sync', () => {
  let routes;
  let req;
  let dataObject;

  const setReqDefault = (property, type = 'object') => {
    req = {};
    dataObject = { _id: 'dataId' };
    req[property] = {
      namespace: 'model1',
      data: type === 'string' ? JSON.stringify(dataObject) : dataObject,
    };
  };

  beforeEach(async () => {
    jest.mock('../../auth');
    routes = instrumentRoutes(syncRoutes);
    models.model1 = {
      save: jasmine.createSpy('model1.save'),
      delete: jasmine.createSpy('model1.delete'),
    };

    models.model2 = {
      save: jasmine.createSpy('model2.save'),
      delete: jasmine.createSpy('model2.delete'),
    };
    spyOn(search, 'delete');
    spyOn(search, 'indexEntities');
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
      expect(models.model1.save).toHaveBeenCalledWith(dataObject);
      expect(response).toBe('ok');

      req.body.namespace = 'model2';
      await routes.post('/api/sync', req);
      expect(models.model2.save).toHaveBeenCalledWith(dataObject);
      expect(search.indexEntities).not.toHaveBeenCalled();
    });

    describe('on error', () => {
      it('should call next', async () => {
        models.model1.save.and.returnValue(Promise.reject(new Error('error')));
        try {
          await routes.post('/api/sync', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });

    describe('when namespace is entities', () => {
      it('should index on elastic', async () => {
        models.entities = {
          save: jasmine.createSpy('entities.save'),
          delete: jasmine.createSpy('entities.delete'),
        };

        req.body = {
          namespace: 'entities',
          data: { _id: 'id' },
        };

        await routes.post('/api/sync', req);
        expect(search.indexEntities).toHaveBeenCalledWith({ _id: 'id' }, '+fullText');
      });
    });

    describe('when namespace is settings', () => {
      it('should replace the incomming id with the local id', async () => {
        models.settings = {
          save: jasmine.createSpy('settings.save'),
          get: () => Promise.resolve([{ _id: 'slaveId' }]),
        };

        req.body = {
          namespace: 'settings',
          data: { _id: 'masterId', languages: 'ln' },
        };

        await routes.post('/api/sync', req);
        expect(models.settings.save).toHaveBeenCalledWith({ _id: 'slaveId', languages: 'ln' });
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
      expect(models.model1.delete).toHaveBeenCalledWith(dataObject);
      expect(response).toBe('ok');

      req.query.namespace = 'model2';
      await routes.delete('/api/sync', req);
      expect(models.model2.delete).toHaveBeenCalledWith(dataObject);
      expect(search.delete).not.toHaveBeenCalled();
    });

    describe('on error', () => {
      it('should call next if model fails', async () => {
        models.model1.delete.and.returnValue(Promise.reject(new Error('error')));
        try {
          await routes.delete('/api/sync', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });

    describe('when namespace is entities', () => {
      beforeEach(() => {
        models.entities = {
          save: jasmine.createSpy('entities.save'),
          delete: jasmine.createSpy('entities.delete'),
        };

        req.query = {
          namespace: 'entities',
          data: JSON.stringify({ _id: 'id' }),
        };
      });

      it('should delete it from elastic', async () => {
        await routes.delete('/api/sync', req);
        expect(search.delete).toHaveBeenCalledWith({ _id: 'id' });
      });

      it('should call next if elastic fails', async () => {
        search.delete.and.returnValue(Promise.reject(new Error('error')));
        try {
          await routes.delete('/api/sync', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });

      it('should not fail if elastic path has already been deleted (statusCode 404)', async () => {
        const error = new Error('Not Found :: 404');
        error.statusCode = 404;

        search.delete.and.returnValue(Promise.reject(error));
        const response = await routes.delete('/api/sync', req);
        expect(response).toBe('ok');
      });
    });
  });
});
