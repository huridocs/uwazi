import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import statsRoutes from '../routes';
import request from 'supertest';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from './fixtures';
import { elastic } from 'api/search';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Stats routes', () => {
  const app: Application = setUpApp(statsRoutes);

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'stats');
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET /api/stats', () => {
    it('returns the aggregated stats', async () => {
      jest.spyOn(elastic.cat, 'indices').mockResolvedValue({ body: [{ 'store.size': 5000 }] });
      const { body } = await request(app).get('/api/stats').expect(200);
      expect(body).toEqual({
        users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
        entities: { total: 10 },
        files: { total: 2 },
        storage: { total: 15000 },
      });
    });
  });
});
