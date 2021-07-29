import { Application } from 'express';
import request from 'supertest';

import { setUpApp } from 'api/utils/testingRoutes';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import pagesRoutes from '../routes';
import { fixtures } from './fixtures';

const getUser = () => ({ _username: 'user 1', role: 'admin' });

const app: Application = setUpApp(pagesRoutes, (req, _res, next) => {
  (req as any).user = getUser();
  next();
});

describe('Pages Routes', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.disconnect();
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
