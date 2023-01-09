import { search } from 'api/search';
import 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import documentRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import entities from '../entities';
import * as entitiesSavingManager from '../entitySavingManager';
import templates from '../../templates/templates';
import thesauri from '../../thesauri';
import fixtures, { templateId, unpublishedDocId, batmanFinishesId } from './fixtures.js';

describe('entities', () => {
  let routes;

  beforeEach(async () => {
    routes = instrumentRoutes(documentRoutes);
    jest
      .spyOn(search, 'countPerTemplate')
      .mockImplementation(async () => Promise.resolve({ templateCount: 0 }));
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: {
          title: 'Batman begins',
          template: templateId,
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

    it('should create a new document with current user', done => {
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

    it('should emit thesauriChange socket event with the modified thesaurus based on the entity template', async () => {
      const user = {
        _id: 'c08ef2532f0bd008ac5174b45e033c93',
        username: 'admin',
      };
      req = {
        body: {
          title: 'Batman begins',
          template: 'template',
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

  describe('GET', () => {
    it('should return matching document', async () => {
      const expectedEntity = [
        {
          sharedId: 'sharedId',
          published: true,
        },
      ];
      jest
        .spyOn(entities, 'getWithRelationships')
        .mockImplementation(async () => Promise.resolve(expectedEntity));
      const req = {
        query: { sharedId: 'sharedId' },
        language: 'lang',
      };

      const response = await routes.get('/api/entities', req);
      expect(entities.getWithRelationships).toHaveBeenCalledWith(
        {
          sharedId: 'sharedId',
          language: 'lang',
          published: true,
        },
        '',
        { limit: 1 }
      );
      expect(response).toEqual({ rows: expectedEntity });
    });

    it('should return document by id', async () => {
      const expectedEntity = fixtures.entities[0];
      delete expectedEntity.fullText;

      const response = await routes.get('/api/entities', {
        query: { _id: batmanFinishesId, omitRelationships: true },
      });

      expect(response.rows.length).toEqual(1);
      expect(response.rows[0]).toEqual(expect.objectContaining(expectedEntity));
    });

    it('should not return unpublished documents when user not logged in', async () => {
      const response = await routes.get('/api/entities', {
        query: { _id: unpublishedDocId, omitRelationships: true },
      });

      expect(response.status).toEqual(404);
      expect(response.rows).toEqual([]);
    });

    it('should allow not fetching the relationships', async () => {
      const expectedEntity = {
        sharedId: 'sharedId',
        published: true,
      };

      entities.getWithRelationships.mockClear();
      jest.spyOn(entities, 'getWithRelationships').mockImplementation(() => {});
      jest.spyOn(entities, 'get').mockImplementation(async () => Promise.resolve([expectedEntity]));

      const req = {
        query: {
          sharedId: 'sharedId',
          omitRelationships: true,
        },
        language: 'lang',
      };

      const {
        rows: [result],
      } = await routes.get('/api/entities', req);
      expect(result).toBe(expectedEntity);
      expect(entities.getWithRelationships).not.toHaveBeenCalled();
      expect(entities.get).toHaveBeenCalledWith(
        {
          sharedId: 'sharedId',
          language: 'lang',
          published: true,
        },
        '',
        { limit: 1 }
      );
    });

    describe('when the document does not exist', () => {
      it('should retunr a 404', async () => {
        jest
          .spyOn(entities, 'getWithRelationships')
          .mockImplementation(async () => Promise.resolve([]));
        const req = {
          query: { sharedId: 'idontexist' },
          language: 'en',
        };

        const response = await routes.get('/api/entities', req);
        expect(response.status).toBe(404);
      });
    });

    describe('when the document has unpublished relationships and the user is unauthenticated', () => {
      it('should remove private relationships from response', async () => {
        jest.spyOn(entities, 'getWithRelationships').mockReturnValue(
          Promise.resolve([
            {
              sharedId: 'e1',
              published: true,
              relationships: [
                {
                  entityData: {
                    sharedId: 'e1',
                    published: true,
                  },
                },
                {
                  entityData: {
                    sharedId: 'e2',
                    published: false,
                  },
                },
                {
                  entityData: {
                    sharedId: 'e3',
                    published: true,
                  },
                },
              ],
            },
          ])
        );

        const req = {
          query: { sharedId: 'sharedId' },
          language: 'lang',
        };

        const {
          rows: [result],
        } = await routes.get('/api/entities', req);
        expect(result).toEqual({
          sharedId: 'e1',
          published: true,
          relationships: [
            {
              entityData: {
                sharedId: 'e1',
                published: true,
              },
            },
            {
              entityData: {
                sharedId: 'e3',
                published: true,
              },
            },
          ],
        });
      });
    });
  });

  describe('/api/entities/get_raw_page', () => {
    it('should return formattedPlainTextPages page requested', async () => {
      jest.spyOn(entities, 'countByTemplate').mockImplementation(async () => Promise.resolve(2));
      const req = { query: { templateId: 'templateId' } };

      const response = await routes.get('/api/entities/count_by_template', req);

      expect(entities.countByTemplate).toHaveBeenCalledWith('templateId');
      expect(response).toEqual(2);
    });
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

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/entities')).toMatchSnapshot();
    });

    it('should use entities to delete it', async () => {
      const req = {
        query: {
          sharedId: 123,
          _rev: 456,
        },
      };
      await routes.delete('/api/entities', req);
      expect(entities.delete).toHaveBeenCalledWith(req.query.sharedId);
    });
  });

  describe('POST /api/entities/bulkdelete', () => {
    beforeEach(() => {
      jest
        .spyOn(entities, 'deleteMultiple')
        .mockImplementation(async () => Promise.resolve({ json: 'ok' }));
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/entities/bulkdelete')).toMatchSnapshot();
    });

    it('should use entities to delete it', async () => {
      const req = { body: { sharedIds: [123, 456] } };
      await routes.post('/api/entities/bulkdelete', req);
      expect(entities.deleteMultiple).toHaveBeenCalledWith([123, 456]);
    });
  });
});
