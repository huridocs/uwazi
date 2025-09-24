import { Application, NextFunction, Request, Response } from 'express';
// @ts-expect-error TS(2307): Cannot find module '../utils/testingRoutes.js' or ... Remove this comment to see the full error message
import { setUpApp } from '../utils/testingRoutes.js';
import statsRoutes from '../routes';
import request from 'supertest';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';
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
