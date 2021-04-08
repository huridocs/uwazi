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
    it('should return all entities for the default language', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ _id: entity1en.toString(), title: 'title to search' }),
        expect.objectContaining({ _id: entity2en.toString(), title: 'does not match' }),
        expect.objectContaining({ _id: entity3en.toString(), title: 'title to search 2' }),
      ]);
    });

    it('should return all entities for the passed language', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .set('content-language', 'es')
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ _id: entity1es.toString(), title: 'titulo to search' }),
        expect.objectContaining({ _id: entity2es.toString(), title: 'does not match' }),
        expect.objectContaining({ _id: entity3es.toString(), title: 'titulo to search 2' }),
      ]);
    });

    it('should return entities that match the searchQuey', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchString: 'search' } })
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ title: 'title to search' }),
        expect.objectContaining({ title: 'title to search 2' }),
      ]);
    });
  });
});
