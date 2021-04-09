import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import request from 'supertest';

import { testingDB } from 'api/utils/testing_db';

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

describe('entities routes', () => {
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(fixturesTitleSearch, 'entities.v2.index');
  });

  afterAll(async () => testingDB.disconnect());

  describe('GET', () => {
    it('should return all entities for the default language and required links', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({
          _id: entity1en.toString(),
          title: 'title to search',
          sharedId: 'entity1SharedId',
          language: 'en',
        }),
        expect.objectContaining({ _id: entity2en.toString(), title: 'title does not match' }),
        expect.objectContaining({ _id: entity3en.toString(), title: 'title to search 2' }),
      ]);

      expect(body.links.self).toBe('/api/v2/entities');
    });

    it('should return all entities for the passed language', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .set('content-language', 'es')
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

    it('should return entities that match the searchQuey', async () => {
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
        .query({ filter: { searchString: 'search' } })
        .set('content-language', 'es')
        .expect(200);

      expect(bodyEs.data).toEqual([expect.objectContaining({ title: 'titulo to search' })]);
    });

    it('should allow limiting the results and return required links', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchString: 'title' }, page: { limit: 2 } });

      expect(body.data).toEqual([
        expect.objectContaining({ _id: entity1en.toString() }),
        expect.objectContaining({ _id: entity2en.toString() }),
      ]);

      const expectedUrl = '/api/v2/entities?filter%5BsearchString%5D=title&page%5Blimit%5D=2';

      expect(body.links.first).toBe(expectedUrl);
    });
  });
});
