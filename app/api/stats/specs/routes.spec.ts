import { Application, NextFunction, Request, Response } from 'express';
import { setUpApp } from 'api/utils/testingRoutes';
import statsRoutes from '../routes';
import request from 'supertest';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from './fixtures';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('Stats routes', () => {
  const app: Application = setUpApp(statsRoutes);

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'stats.routes');
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET /api/stats', () => {
    it('returns the aggregated stats', async () => {
      const { body } = await request(app).get('/api/stats').expect(200);

      expect(body).toEqual({
        users: {
          total: expect.any(Number),
          admin: expect.any(Number),
          editor: expect.any(Number),
          collaborator: expect.any(Number),
        },
        entities: { total: expect.any(Number) },
        files: { total: expect.any(Number) },
        storage: { total: expect.any(Number) },
      });
    });
  });
});
