import type { Application } from 'express';
import request from 'supertest';
import { ObjectId } from 'mongodb';

import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { pagesV2Routes } from '../routes.js';
import { fixtures } from '#api/pages/specs/fixtures.js';

const getUser = () => ({ _id: new ObjectId().toString(), _username: 'user 1', role: 'admin' });

const app: Application = setUpApp(pagesV2Routes, (req, _res, next) => {
  (req as any).user = getUser();
  next();
});

describe('Pages V2 HTTP routes', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('POST /api/pages/release', () => {
    it('should return 404 when the page does not exist', async () => {
      const response = await request(app)
        .post('/api/pages/release')
        .set('content-language', 'en')
        .send({ sharedId: 'missing-page', release_message: 'nope' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('missing-page');
    });
  });
});
