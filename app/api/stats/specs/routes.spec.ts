import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { setUpApp } from '#api/utils/testingRoutes.js';
import statsRoutes from '../routes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { fixtures } from './fixtures.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = {
      _id: 'admin-id',
      username: 'admin',
      email: 'admin@email.com',
      role: 'admin',
      groups: [],
    };
    next();
  }
);

describe('Stats routes', () => {
  const adminUser = fixtures.users?.[0];
  const app = setUpApp(statsRoutes, (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = adminUser;
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'stats.routes');
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET /api/stats', () => {
    it('returns the aggregated stats', async () => {
      const { body } = await request(app)
        .get('/api/stats')
        .set('content-language', 'en')
        .expect(200);

      expect(body).toEqual({
        users: {
          total: expect.any(Number),
          admin: expect.any(Number),
          editor: expect.any(Number),
          collaborator: expect.any(Number),
        },
        entities: { total: 5 },
        files: { total: expect.any(Number) },
        storage: { total: expect.any(Number) },
      });
    });
  });
});
