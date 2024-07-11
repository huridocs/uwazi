import request from 'supertest';
import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import { elastic } from 'api/search';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { searchRoutes } from '../routes';

import {
  fixturesTitleSearch,
  entity1en,
  entity2en,
  entity3en,
  entity4en,
  entity5en,
  entity1es,
  entity2es,
  entity3es,
  entity4es,
  entity5es,
} from './fixturesTitleSearch';

describe('entities get searchString', () => {
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await testingEnvironment.setUp(fixturesTitleSearch, 'entities.v2.index');
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET', () => {
    it('should have a validation', async () => {
      const { body } = await request(app)
        .get('/api/v2/search')
        .query({ not_allowed_property: { key: 'value' } });

      expect(body.error).toBe('validation failed');
    });

    it('should return all entities for the default language and required links', async () => {
      const { body } = await request(app).get('/api/v2/search').expect(200);

      expect(body.data).toEqual([
        {
          _id: entity1en.toString(),
          title: 'title to search one',
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
        {
          _id: entity4en.toString(),
          sharedId: 'entity4SharedId',
          title: 'entity with short fullText',
          template: 'template1',
        },
        {
          _id: entity5en.toString(),
          sharedId: 'entity5SharedId',
          title: 'entity with short fullText 2',
          template: 'template1',
        },
      ]);

      expect(body.links.self).toBe('/api/v2/search');
    });

    it('should return all entities for the passed language', async () => {
      const { body } = await request(app)
        .get('/api/v2/search')
        .set('content-language', 'es')
        .query({ fields: ['title', 'sharedId', 'language'] })
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ _id: entity1es.toString(), title: 'titulo to search one' }),
        expect.objectContaining({
          _id: entity2es.toString(),
          title: 'title does not match',
          sharedId: 'entity2SharedId',
          language: 'es',
        }),
        expect.objectContaining({ _id: entity3es.toString(), title: 'title without busqueda' }),
        expect.objectContaining({
          _id: entity4es.toString(),
          title: 'entidad con texto completo corto',
        }),
        expect.objectContaining({
          _id: entity5es.toString(),
          title: 'entidad con texto completo corto 2',
        }),
      ]);
    });

    it('should return entities that match the searchString', async () => {
      const { body: bodyEn } = await request(app)
        .get('/api/v2/search')
        .query({ filter: { searchString: 'search' } })
        .expect(200);

      expect(bodyEn.data).toEqual([
        expect.objectContaining({ title: 'title to search one' }),
        expect.objectContaining({ title: 'title to search 2' }),
      ]);

      const { body: bodyEs } = await request(app)
        .get('/api/v2/search')
        .query({ filter: { searchString: 'title:(search)' } })
        .set('content-language', 'es')
        .expect(200);

      expect(bodyEs.data).toEqual([expect.objectContaining({ title: 'titulo to search one' })]);

      const { body: bodyFull } = await request(app)
        .get('/api/v2/search')
        .query({ filter: { searchString: 'unique' } })
        .expect(200);

      expect(bodyFull.data).toEqual([
        expect.objectContaining({ title: 'entity with short fullText' }),
      ]);
    });

    it('should allow multiple fullText queries', async () => {
      const { body } = await request(app)
        .get('/api/v2/search')
        .query({ filter: { searchString: 'fullText:(unique) fullText:(exquisite)' } })
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ title: 'entity with short fullText' }),
        expect.objectContaining({ title: 'entity with short fullText 2' }),
      ]);
    });

    it('should return entities that match the searchString, when it is a number', async () => {
      const { body: bodyEn } = await request(app)
        .get('/api/v2/search')
        .query({ filter: { searchString: '2' } })
        .expect(200);

      expect(bodyEn.data).toEqual([
        expect.objectContaining({ title: 'title to search 2' }),
        expect.objectContaining({ title: 'entity with short fullText 2' }),
      ]);
    });

    it('should still search with simple query for no valid lucene syntax', async () => {
      const { body } = await request(app)
        .get('/api/v2/search')
        .query({ filter: { searchString: 'title:(title OR)' }, page: { limit: 2 } });

      expect(body.data).toEqual([
        expect.objectContaining({ _id: entity1en.toString() }),
        expect.objectContaining({ _id: entity2en.toString() }),
      ]);
    });

    it('should return only the requested fields', async () => {
      const { body } = await request(app)
        .get('/api/v2/search')
        .query({ fields: ['sharedId', 'language'] });
      expect(body.data).toEqual([
        {
          _id: entity1en.toString(),
          sharedId: 'entity1SharedId',
          language: 'en',
        },
        { _id: entity2en.toString(), sharedId: 'entity2SharedId', language: 'en' },
        { _id: entity3en.toString(), sharedId: 'entity3SharedId', language: 'en' },
        { _id: entity4en.toString(), sharedId: 'entity4SharedId', language: 'en' },
        { _id: entity5en.toString(), sharedId: 'entity5SharedId', language: 'en' },
      ]);
    });

    describe('Error handling', () => {
      it('should handle errors on POST', async () => {
        jest.spyOn(elastic, 'search').mockImplementation(() => {
          throw new Error('Error for test');
        });
        const { body, status } = await request(app).get('/api/v2/search');

        expect(status).toBe(500);
        expect(body.error).toContain('Error for test');
      });
    });
  });
});
