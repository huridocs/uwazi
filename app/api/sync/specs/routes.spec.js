import { models } from 'api/odm';
import { search } from 'api/search';
import { storage } from 'api/files/storage';
import 'api/utils/jasmineHelpers';

import * as index from 'api/search/entitiesIndex';
import instrumentRoutes from '../../utils/instrumentRoutes';
import syncRoutes from '../routes';

describe('sync', () => {
  let routes;
  let req;
  let dataObject;
  let model1;
  let model2;

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

    model1 = { save: jest.fn(), delete: jest.fn() };
    model2 = { save: jest.fn(), delete: jest.fn() };

    models.model1 = () => model1;
    models.model2 = () => model2;

    jest.spyOn(search, 'delete').mockImplementation(() => {});
    jest.spyOn(search, 'indexEntities').mockImplementation(() => {});
    jest.spyOn(storage, 'removeFile').mockImplementation(() => {});
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
      expect(model1.save).toHaveBeenCalledWith(dataObject);
      expect(response).toBe('ok');

      req.body.namespace = 'model2';
      await routes.post('/api/sync', req);
      expect(model2.save).toHaveBeenCalledWith(dataObject);
      expect(search.indexEntities).not.toHaveBeenCalled();
    });

    describe('on error', () => {
      it('should call next', async () => {
        model1.save.mockReturnValue(Promise.reject(new Error('error')));
        try {
          await routes.post('/api/sync', req);
        } catch (error) {
          expect(error).toEqual(new Error('error'));
        }
      });
    });

    describe('when namespace is templates', () => {
      it('should update the mappings', async () => {
        jest.spyOn(index, 'updateMapping').mockImplementation(() => {});
        const templates = { save: jest.fn() };
        models.templates = () => templates;

        req.body = {
          namespace: 'templates',
          data: { _id: 'id' },
        };

        await routes.post('/api/sync', req);
        expect(templates.save).toHaveBeenCalledWith({ _id: 'id' });
        expect(index.updateMapping).toHaveBeenCalledWith([req.body.data]);
      });

      it('should update the mappings if many templates are provided', async () => {
        jest.spyOn(index, 'updateMapping').mockImplementation(() => {});
        const templates = { save: jest.fn(), saveMultiple: jest.fn() };
        models.templates = () => templates;

        req.body = {
          namespace: 'templates',
          data: [{ _id: 'id1' }, { _id: 'id2' }],
        };

        await routes.post('/api/sync', req);
        expect(templates.saveMultiple).toHaveBeenCalledWith([{ _id: 'id1' }, { _id: 'id2' }]);
        expect(index.updateMapping).toHaveBeenCalledWith(req.body.data);
      });

      it('should set the rest of the templates as non-default if the provided is default', async () => {
        jest.spyOn(index, 'updateMapping').mockImplementation(() => {});
        const templates = {
          saveMultiple: jest.fn(),
          get: jest.fn().mockResolvedValue([
            {
              _id: 'prevDefault',
              name: 'Previous default',
              default: true,
            },
          ]),
        };
        models.templates = () => templates;

        req.body = {
          namespace: 'templates',
          data: { _id: 'id', default: true },
        };

        await routes.post('/api/sync', req);
        expect(templates.saveMultiple).toHaveBeenCalledWith([
          {
            _id: 'prevDefault',
            name: 'Previous default',
            default: false,
          },
          { _id: 'id', default: true },
        ]);
        expect(index.updateMapping).toHaveBeenCalledWith(req.body.data);
      });
    });

    describe('when namespace is entities', () => {
      it('should index on elastic', async () => {
        const entities = { save: jest.fn(), delete: jest.fn() };
        models.entities = () => entities;

        req.body = {
          namespace: 'entities',
          data: { _id: 'id' },
        };

        await routes.post('/api/sync', req);
        expect(search.indexEntities).toHaveBeenCalledWith({ _id: 'id' }, '+fullText');
      });
    });

    describe('when namespace is files', () => {
      it('should index on elastic', async () => {
        const files = { save: jest.fn(), delete: jest.fn() };
        models.files = () => files;

        req.body = {
          namespace: 'files',
          data: { entity: 'shared' },
        };

        await routes.post('/api/sync', req);
        expect(search.indexEntities).toHaveBeenCalledWith({ sharedId: 'shared' }, '+fullText');
      });
    });

    describe('when namespace is settings', () => {
      it('should replace the incomming id with the local id', async () => {
        const settings = { save: jest.fn(), get: () => Promise.resolve([{ _id: 'slaveId' }]) };
        models.settings = () => settings;

        req.body = {
          namespace: 'settings',
          data: { _id: 'masterId', languages: 'ln' },
        };

        await routes.post('/api/sync', req);
        expect(settings.save).toHaveBeenCalledWith({ _id: 'slaveId', languages: 'ln' });
      });
    });

    describe('sync/upload', () => {
      it('should need authorization', () => {
        expect(routes._post('/api/sync/upload', {})).toNeedAuthorization();
      });
    });

    describe('when namespace is translations', () => {
      it('should respect menu and filters translations', async () => {
        const translations = {
          save: jest.fn(),
          delete: jest.fn(),
          get: jest.fn().mockReturnValue(
            Promise.resolve([
              {
                _id: 'id',
                contexts: [
                  { id: 'Menu', values: [{ key: 'About us', value: 'About us' }] },
                  { id: 'Filters', values: [{ key: 'Cause', value: 'Cause' }] },
                ],
              },
            ])
          ),
        };
        models.translations = () => translations;

        req.body = {
          namespace: 'translations',
          data: {
            _id: 'id',
            contexts: [{ id: 'System', values: [{ key: 'Search', value: 'Search' }] }],
          },
        };

        await routes.post('/api/sync', req);
        expect(translations.save).toHaveBeenCalledWith({
          _id: 'id',
          contexts: [
            { id: 'System', values: [{ key: 'Search', value: 'Search' }] },
            { id: 'Menu', values: [{ key: 'About us', value: 'About us' }] },
            { id: 'Filters', values: [{ key: 'Cause', value: 'Cause' }] },
          ],
        });
      });
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      setReqDefault('query', 'string');
    });

    it('should need authorization', () => {
      expect(routes._delete('/api/sync', req)).toNeedAuthorization();
    });

    it('should remove on the namespaced model', async () => {
      const response = await routes.delete('/api/sync', req);
      expect(model1.delete).toHaveBeenCalledWith(dataObject);
      expect(response).toBe('ok');

      req.query.namespace = 'model2';
      await routes.delete('/api/sync', req);
      expect(model2.delete).toHaveBeenCalledWith(dataObject);
      expect(search.delete).not.toHaveBeenCalled();
    });

    describe('when namespace is files', () => {
      beforeEach(() => {
        const files = {
          save: jest.fn(),
          delete: jest.fn(),
          getById: () =>
            Promise.resolve({ entity: 'entityId', filename: 'filename', type: 'custom' }),
        };
        models.files = () => files;

        req.query = {
          namespace: 'files',
          data: JSON.stringify({ _id: 'file_id' }),
        };
      });

      it('should delete it from elastic', async () => {
        await routes.delete('/api/sync', req);
        expect(search.indexEntities).toHaveBeenCalledWith({ sharedId: 'entityId' });
      });

      it('should delete it from the file system', async () => {
        await routes.delete('/api/sync', req);
        expect(storage.removeFile).toHaveBeenCalledWith('filename', 'custom');
      });
    });

    describe('when namespace is entities', () => {
      beforeEach(() => {
        const entities = { save: jest.fn(), delete: jest.fn() };
        models.entities = () => entities;

        req.query = {
          namespace: 'entities',
          data: JSON.stringify({ _id: 'id' }),
        };
      });

      it('should delete it from elastic', async () => {
        await routes.delete('/api/sync', req);
        expect(search.delete).toHaveBeenCalledWith({ _id: 'id' });
      });

      it('should not fail if elastic path has already been deleted (statusCode 404)', async () => {
        const error = new Error('Not Found :: 404');
        error.statusCode = 404;

        search.delete.mockReturnValue(Promise.reject(error));
        const response = await routes.delete('/api/sync', req);
        expect(response).toBe('ok');
      });
    });
  });
});
