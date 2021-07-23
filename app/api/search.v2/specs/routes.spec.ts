import request from 'supertest';
import { Application } from 'express';
import { testingDB } from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';
import errorLog from 'api/log/errorLog';
import { elastic } from 'api/search';

import { searchRoutes } from '../routes';
import {
  fixturesTitleSearch,
  entity1en,
  entity2en,
  entity3en,
  entity1es,
  entity2es,
  entity3es,
} from './fixturesTitleSearch';

describe('entities get searchString', () => {
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(fixturesTitleSearch, 'entities.v2.index');
  });

  afterAll(async () => testingDB.disconnect());

  describe('GET', () => {
    it('should have a validation', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query({ not_allowed_property: { key: 'value' } });

      expect(body.error).toBe('validation failed');
    });

    it('should return all entities for the default language and required links', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .expect(200);

      expect(body.data).toEqual([
        {
          _id: entity1en.toString(),
          title: 'title to search',
          sharedId: 'entity1SharedId',
          template: 'template1',
        },
        {
          _id: entity2en.toString(),
          title: 'title does not match',
          sharedId: 'entity2SharedId',
          template: 'template1',
        },
        {
          _id: entity3en.toString(),
          sharedId: 'entity3SharedId',
          title: 'title to search 2',
          template: 'template1',
        },
      ]);

      expect(body.links.self).toBe('/api/v2/entities');
    });

    it('should return all entities for the passed language', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .set('content-language', 'es')
        .query({ fields: ['title', 'sharedId', 'language'] })
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ _id: entity1es.toString(), title: 'titulo to search' }),
        expect.objectContaining({
          _id: entity2es.toString(),
          title: 'title does not match',
          sharedId: 'entity2SharedId',
          language: 'es',
        }),
        expect.objectContaining({ _id: entity3es.toString(), title: 'title without busqueda' }),
      ]);
    });

    it('should return entities that match the searchString', async () => {
      const { body: bodyEn } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchString: 'search' } })
        .expect(200);

      expect(bodyEn.data).toEqual([
        expect.objectContaining({ title: 'title to search' }),
        expect.objectContaining({ title: 'title to search 2' }),
      ]);

      const { body: bodyEs } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchString: 'title:(search)' } })
        .set('content-language', 'es')
        .expect(200);

      expect(bodyEs.data).toEqual([expect.objectContaining({ title: 'titulo to search' })]);
    });

    it('should allow limiting the results and return required links', async () => {
      const {
        body,
        // @ts-ignore
        req: { path },
      } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchString: 'title:(title)' }, page: { limit: 2 } });

      expect(body.data).toEqual([
        expect.objectContaining({ _id: entity1en.toString() }),
        expect.objectContaining({ _id: entity2en.toString() }),
      ]);

      expect(body.links.first).toEqual(path);
    });

    it('should still search with simple query for no valid lucene syntax', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchString: 'title:(title OR)' }, page: { limit: 2 } });

      expect(body.data).toEqual([
        expect.objectContaining({ _id: entity1en.toString() }),
        expect.objectContaining({ _id: entity2en.toString() }),
      ]);
    });

    it('should return only the requested fields', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query({ fields: ['sharedId', 'language'] });
      expect(body.data).toEqual([
        {
          _id: entity1en.toString(),
          sharedId: 'entity1SharedId',
          language: 'en',
        },
        { _id: entity2en.toString(), sharedId: 'entity2SharedId', language: 'en' },
        { _id: entity3en.toString(), sharedId: 'entity3SharedId', language: 'en' },
      ]);
    });

    it.each([3, null, ''])(
      'should throw an error is a field is not a string',
      async invalidField => {
        await request(app)
          .get('/api/v2/entities')
          .query({ fields: ['sharedId', 'language', invalidField] })
          .expect(400);
      }
    );

    describe('Error handling', () => {
      it('should handle errors on POST', async () => {
        spyOn(elastic, 'search').and.throwError('Error for test');
        spyOn(errorLog, 'error');
        const { body, status } = await request(app).get('/api/v2/entities');

        expect(status).toBe(500);
        expect(body.error).toContain('Error for test');
      });
    });
  });
});
