import { search } from '#api/search/index.js';
import '#api/utils/jasmineHelpers.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import templates from '../../core/v1_layer/templates/templates.js';
import thesauri from '../../thesauri.js';
import instrumentRoutes from '../../utils/instrumentRoutes.js';
import entities from '../entities.js';
import * as entitiesSavingManager from '../entitySavingManager.js';
import documentRoutes from '../routes.js';
import fixtures, { templateId } from './fixtures.js';

describe('entities', () => {
  let routes;

  beforeEach(async () => {
    routes = instrumentRoutes(documentRoutes);
    jest
      .spyOn(search, 'countPerTemplate')
      .mockImplementation(async () => Promise.resolve({ templateCount: 0 }));
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: {
          title: 'Batman begins',
          template: templateId,
          sharedId: 'existing123',
        },
        user: { username: 'admin' },
        language: 'lang',
        io: {
          sockets: {
            emit: () => {},
          },
        },
      };
    });

    it('should need authorization', () => {
      expect(routes._post('/api/entities', req)).toNeedAuthorization();
      expect(routes._post('/api/entity_denormalize', req)).toNeedAuthorization();
    });

    it('should update an entity with current user (V1 path)', done => {
      jest
        .spyOn(entitiesSavingManager, 'saveEntity')
        .mockReturnValue(Promise.resolve({ entity: 'entity', errors: [] }));
      jest
        .spyOn(templates, 'getById')
        .mockImplementation(async () => Promise.resolve({ values: [] }));
      jest
        .spyOn(thesauri, 'templateToThesauri')
        .mockImplementation(async () => Promise.resolve('document'));
      const sockets = {
        emitToCurrentTenant: jest.fn(),
      };
      routes.post('/api/entities', { ...req, sockets }).then(document => {
        expect(document).toBe('entity');
        expect(entitiesSavingManager.saveEntity).toHaveBeenCalledWith(req.body, {
          user: req.user,
          language: 'lang',
        });
        done();
      });
    });

    it('should denormalize an entity', async () => {
      jest.spyOn(entities, 'denormalize').mockImplementation(async () => Promise.resolve('entity'));

      const document = await routes.post('/api/entity_denormalize', req);
      expect(document).toBe('entity');
      expect(entities.denormalize).toHaveBeenCalledWith(req.body, {
        user: req.user,
        language: 'lang',
      });
    });

    it('should emit thesauriChange socket event when updating entity (V1 path)', async () => {
      const user = {
        _id: 'c08ef2532f0bd008ac5174b45e033c93',
        username: 'admin',
      };
      req = {
        body: {
          title: 'Batman begins',
          template: 'template',
          sharedId: 'existing456',
        },
        user,
        language: 'lang',
        sockets: {
          emitToCurrentTenant: jest.fn((event, thesaurus) => {
            expect(event).toBe('thesauriChange');
            expect(thesaurus).toBe('templateTransformed');
            expect(thesauri.templateToThesauri).toHaveBeenCalledWith('template', 'lang', user, {
              templateCount: 0,
            });
          }),
        },
      };

      jest
        .spyOn(entitiesSavingManager, 'saveEntity')
        .mockReturnValue(Promise.resolve({ entity: { _id: 'id' }, errors: [] }));
      jest
        .spyOn(entities, 'getWithRelationships')
        .mockReturnValue(Promise.resolve(['entityWithRelationShips']));
      jest.spyOn(templates, 'getById').mockImplementation(async () => Promise.resolve('template'));
      jest
        .spyOn(thesauri, 'templateToThesauri')
        .mockImplementation(async () => Promise.resolve('templateTransformed'));
      await routes.post('/api/entities', req);
    });

    describe('/entities/multipleupdate', () => {
      beforeEach(() => {
        req = {
          body: {
            ids: ['1', '2'],
            values: { metadata: { text: [{ value: 'new text' }] } },
          },
          user: {
            _id: 'c08ef2532f0bd008ac5174b45e033c93',
            username: 'admin',
          },
          language: 'lang',
        };
      });

      it('should need authorization', () => {
        expect(routes._post('/api/entities/multipleupdate', req)).toNeedAuthorization();
      });

      it('should call multipleUpdate with the ids and the metadata in the body', async () => {
        const mockedResponse = [{ sharedId: '1' }, { sharedId: '2' }];
        jest
          .spyOn(entities, 'multipleUpdate')
          .mockImplementation(async () => Promise.resolve(mockedResponse));
        const response = await routes.post('/api/entities/multipleupdate', req);
        expect(entities.multipleUpdate).toHaveBeenCalledWith(
          ['1', '2'],
          { metadata: { text: [{ value: 'new text' }] } },
          {
            user: {
              _id: 'c08ef2532f0bd008ac5174b45e033c93',
              username: 'admin',
            },
            language: 'lang',
          }
        );
        expect(response).toBe(mockedResponse);
      });
    });
  });

  it('should return formattedPlainTextPages page requested', async () => {
    jest.spyOn(entities, 'countByTemplate').mockImplementation(async () => Promise.resolve(2));
    const req = { query: { templateId: 'templateId' } };

    const response = await routes.get('/api/entities/count_by_template', req);

    expect(entities.countByTemplate).toHaveBeenCalledWith('templateId');
    expect(response).toEqual(2);
  });

  describe('/api/entities/count_by_template', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/entities/count_by_template')).toMatchSnapshot();
    });
    it('should return count of entities using a specific template', async () => {
      jest.spyOn(entities, 'countByTemplate').mockImplementation(async () => Promise.resolve(2));
      const req = { query: { templateId: 'templateId' } };

      const response = await routes.get('/api/entities/count_by_template', req);
      expect(entities.countByTemplate).toHaveBeenCalledWith('templateId');
      expect(response).toEqual(2);
    });
  });

  describe('DELETE /api/entities', () => {
    beforeEach(() => {
      jest
        .spyOn(entities, 'delete')
        .mockImplementation(async () => Promise.resolve({ json: 'ok' }));
    });

    it('should use entities to delete it', async () => {
      const req = {
        query: {
          sharedId: '123',
          _rev: 456,
        },
      };
      await routes.delete('/api/entities', req);
      expect(entities.delete).toHaveBeenCalledWith('123');
    });
  });
});
