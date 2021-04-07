import { Application } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import request from 'supertest';
import { testingDB } from 'api/utils/testing_db';
import { searchRoutes } from '../routes';

describe('entities routes', () => {
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await testingDB.setupFixturesAndContext(
      {
        settings: [{ languages: [{ key: 'en', default: true }, { key: 'es' }] }],
        entities: [
          { title: 'title to search', language: 'en' },
          { title: 'does not match', language: 'en' },
          { title: 'title to search 2', language: 'en' },

          { title: 'titulo to search', language: 'es' },
          { title: 'does not match', language: 'es' },
          { title: 'titulo to search 2', language: 'es' },
        ],
      },
      'entities.v2.index'
    );
  });

  afterAll(async () => testingDB.disconnect());

  describe('GET', () => {
    it('should return all entities for the default language', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ _id: expect.anything(), title: 'title to search' }),
        expect.objectContaining({ _id: expect.anything(), title: 'does not match' }),
        expect.objectContaining({ _id: expect.anything(), title: 'title to search 2' }),
      ]);
    });

    it('should return entities that match the searchQuey', async () => {
      const { body } = await request(app)
        .get('/api/v2/entities')
        .query({ filter: { searchQuery: 'search' } })
        .expect(200);

      expect(body.data).toEqual([
        expect.objectContaining({ title: 'title to search' }),
        expect.objectContaining({ title: 'title to search 2' }),
      ]);
    });
  });
});
