import 'api/utils/jasmineHelpers';

import express from 'express';

import { models } from 'api/odm';
import entities from 'api/entities';
import requestAPI from 'supertest';
import search from 'api/search/search';
import path from 'path';
import fs from 'fs';
import * as auth from 'api/auth';

import instrumentRoutes from '../../utils/instrumentRoutes';
import syncRoutes from '../routes.js';
import pathsConfig from '../../config/paths';

describe('sync', () => {
  let routes;
  let req;

  const setReqDefault = (property) => {
    req = {};
    req[property] = { namespace: 'model1', data: 'data' };
  };

  beforeEach(async () => {
    routes = instrumentRoutes(syncRoutes);
    models.model1 = {
      save: jasmine.createSpy('model1.save'),
      delete: jasmine.createSpy('model1.delete')
    };

    models.model2 = {
      save: jasmine.createSpy('model2.save'),
      delete: jasmine.createSpy('model2.delete')
    };
    spyOn(search, 'delete');
    spyOn(entities, 'indexEntities');
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
      expect(models.model1.save).toHaveBeenCalledWith('data');
      expect(response).toBe('ok');

      req.body.namespace = 'model2';
      await routes.post('/api/sync', req);
      expect(models.model2.save).toHaveBeenCalledWith('data');
      expect(entities.indexEntities).not.toHaveBeenCalled();
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
          data: { _id: 'id' }
        };

        await routes.post('/api/sync', req);
        expect(entities.indexEntities).toHaveBeenCalledWith({ _id: 'id' }, '+fullText');
      });
    });

    describe('sync/upload', () => {
      it('should need authorization', () => {
        expect(routes._post('/api/sync/upload', {})).toNeedAuthorization();
      });

      it('should place document without changing name on /uploads', async () => {
        pathsConfig.uploadDocumentsPath = `${__dirname}/uploads/`;
        spyOn(auth, 'needsAuthorization').and.callFake(() => (_req, _res, next) => {
          next();
        });
        try {
          fs.unlinkSync(path.join(pathsConfig.uploadDocumentsPath, 'test.txt'));
        } catch (e) {
          //
        }
        const app = express();
        syncRoutes(app);

        await requestAPI(app)
        .post('/api/sync/upload')
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('file', path.join(__dirname, 'test.txt'));

        const properlyUploaded = fs.existsSync(path.join(pathsConfig.uploadDocumentsPath, 'test.txt'));
        expect(properlyUploaded).toBeTruthy();
      });
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      setReqDefault('query');
    });

    it('should need authorization', () => {
      expect(routes._delete('/api/sync', {})).toNeedAuthorization();
    });

    it('should remove on the namespaced model', async () => {
      const response = await routes.delete('/api/sync', req);
      expect(models.model1.delete).toHaveBeenCalledWith('data');
      expect(response).toBe('ok');

      req.query.namespace = 'model2';
      await routes.delete('/api/sync', req);
      expect(models.model2.delete).toHaveBeenCalledWith('data');
      expect(search.delete).not.toHaveBeenCalled();
    });

    describe('on error', () => {
      it('should call next', async () => {
        models.model1.delete.and.returnValue(Promise.reject(new Error('error')));
        try {
          await routes.delete('/api/sync', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });

    describe('when namespace is entities', () => {
      it('should delete it from elastic', async () => {
        models.entities = {
          save: jasmine.createSpy('entities.save'),
          delete: jasmine.createSpy('entities.delete'),
        };

        req.query = {
          namespace: 'entities',
          data: { _id: 'id' }
        };

        await routes.delete('/api/sync', req);
        expect(search.delete).toHaveBeenCalledWith({ _id: 'id' });
      });
    });
  });
});
