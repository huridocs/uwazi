import { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';

import testingDB from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';

import pagesRoutes from '../routes';
import fixtures from './fixtures';

const getUser = () => ({ _username: 'user 1', role: 'admin' });

const app: Application = setUpApp(
  pagesRoutes,
  (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = getUser();
    next();
  }
);

describe('Pages Routes', () => {
  beforeEach(async () => {
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('/api/pages', () => {
    it('should validate with minimum required props', async () => {
      const goodData = { title: 'good structure' };

      const response = await request(app)
        .post('/api/pages')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('content-language', 'en')
        .send(goodData);

      expect(response.status).toBe(200);
    });

    it('should not validate with wrong structure', async () => {
      const badData = { withoutTitle: true };

      const response = await request(app)
        .post('/api/pages')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(badData);

      expect(response.status).toBe(400);
      expect(response.text).toContain('validation failed');
    });
  });
});
