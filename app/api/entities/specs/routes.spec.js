import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import documentRoutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import entities from '../entities';
import templates from '../../templates/templates';
import thesauris from '../../thesauris/thesauris';
import fixtures, { templateId } from './fixtures.js';

describe('entities', () => {
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(documentRoutes);
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: { title: 'Batman begins', template: templateId },
        user: { username: 'admin' },
        language: 'lang',
        io: { sockets: { emit: () => {} } }
      };
    });

    it('should need authorization', () => {
      expect(routes.post('/api/entities', req)).toNeedAuthorization();
    });

    it('should create a new document with current user', (done) => {
      spyOn(entities, 'save').and.returnValue(Promise.resolve('entity'));
      spyOn(templates, 'getById').and.returnValue(new Promise(resolve => resolve({ values: [] })));
      spyOn(thesauris, 'templateToThesauri').and.returnValue(new Promise(resolve => resolve('document')));

      routes.post('/api/entities', req)
      .then((document) => {
        expect(document).toBe('entity');
        expect(entities.save).toHaveBeenCalledWith(req.body, { user: req.user, language: 'lang' });
        done();
      });
    });

    it('should emit thesauriChange socket event with the modified thesauri based on the entity template', (done) => {
      const user = { _id: 'c08ef2532f0bd008ac5174b45e033c93', username: 'admin' };
      req = {
        body: { title: 'Batman begins', template: 'template' },
        user,
        language: 'lang',
        io: {
          sockets: {
            emit: jest.fn((event, thesauri) => {
              try {
                expect(event).toBe('thesauriChange');
                expect(thesauri).toBe('templateTransformed');
                expect(thesauris.templateToThesauri).toHaveBeenCalledWith('template', 'lang', user);
                done();
              } catch (err) {
                done.fail(err);
              }
            })
          }
        }
      };

      spyOn(entities, 'save').and.returnValue(Promise.resolve({ _id: 'id' }));
      spyOn(entities, 'getWithRelationships').and.returnValue(Promise.resolve(['entityWithRelationShips']));
      spyOn(templates, 'getById').and.returnValue(new Promise(resolve => resolve('template')));
      spyOn(thesauris, 'templateToThesauri').and.returnValue(new Promise(resolve => resolve('templateTransformed')));
      routes.post('/api/entities', req)
      .catch(catchErrors(done));
    });

    describe('/entities/multipleupdate', () => {
      beforeEach(() => {
        req = {
          body: { ids: ['1', '2'], values: { metadata: { text: 'new text' } } },
          user: { _id: 'c08ef2532f0bd008ac5174b45e033c93', username: 'admin' },
          language: 'lang'
        };
      });

      it('should need authorization', () => {
        expect(routes.post('/api/entities/multipleupdate', req)).toNeedAuthorization();
      });

      it('should call multipleUpdate with the ids and the metadata in the body', (done) => {
        spyOn(entities, 'multipleUpdate').and.returnValue(new Promise(resolve => resolve([{ sharedId: '1' }, { sharedId: '2' }])));
        routes.post('/api/entities/multipleupdate', req)
        .then((response) => {
          expect(entities.multipleUpdate)
          .toHaveBeenCalledWith(
            ['1', '2'],
            { metadata: { text: 'new text' } },
            { user: { _id: 'c08ef2532f0bd008ac5174b45e033c93', username: 'admin' }, language: 'lang' }
          );
          expect(response).toEqual(['1', '2']);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('GET', () => {
    it('should return matching document', (done) => {
      const expectedEntity = [{ sharedId: 'sharedId', published: true }];
      spyOn(entities, 'getWithRelationships').and.returnValue(Promise.resolve(expectedEntity));
      const req = {
        query: { _id: 'sharedId' },
        language: 'lang'
      };

      routes.get('/api/entities', req)
      .then((response) => {
        expect(entities.getWithRelationships).toHaveBeenCalledWith({ sharedId: 'sharedId', language: 'lang' });
        expect(response).toEqual({ rows: expectedEntity });
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when the document does not exist', () => {
      it('should retunr a 404', (done) => {
        spyOn(entities, 'getWithRelationships').and.returnValue(Promise.resolve([]));
        const req = {
          query: { _id: 'idontexist' },
          language: 'en'
        };

        routes.get('/api/entities', req)
        .then((response) => {
          expect(response.status).toBe(404);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when the document is unpublished and not loged in', () => {
      it('should return a 404', (done) => {
        spyOn(entities, 'getWithRelationships').and.returnValue(Promise.resolve([{ published: false }]));
        const req = {
          query: { _id: 'unpublished' },
          language: 'en'
        };

        routes.get('/api/entities', req)
        .then((response) => {
          expect(response.status).toBe(404);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('/api/entities/count_by_template', () => {
    it('should return count of entities using a specific template', (done) => {
      spyOn(entities, 'countByTemplate').and.returnValue(new Promise(resolve => resolve(2)));
      const req = { query: { templateId: 'templateId' } };

      routes.get('/api/entities/count_by_template', req)
      .then((response) => {
        expect(entities.countByTemplate).toHaveBeenCalledWith('templateId');
        expect(response).toEqual(2);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE /api/entities', () => {
    beforeEach(() => {
      spyOn(entities, 'delete').and.returnValue(Promise.resolve({ json: 'ok' }));
    });

    it('should use entities to delete it', (done) => {
      const req = { query: { sharedId: 123, _rev: 456 } };
      return routes.delete('/api/entities', req)
      .then(() => {
        expect(entities.delete).toHaveBeenCalledWith(req.query.sharedId);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE /api/entities/multiple', () => {
    beforeEach(() => {
      spyOn(entities, 'deleteMultiple').and.returnValue(Promise.resolve({ json: 'ok' }));
    });

    it('should use entities to delete it', (done) => {
      const req = { query: { sharedIds: '[123, 456]' } };
      return routes.delete('/api/entities/multiple', req)
      .then(() => {
        expect(entities.deleteMultiple).toHaveBeenCalledWith([123, 456]);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
