import type { Application } from 'express';
import request from 'supertest';
import { ObjectId } from 'mongodb';

import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { pagesV2Routes } from '../routes.js';
import { fixtures } from '#api/pages.v2/specs/fixtures.js';

const testConfigs = [
  { name: 'Mongo', postgresPages: false },
  { name: 'Postgres', postgresPages: true },
];

const getUser = () => ({ _id: new ObjectId().toString(), _username: 'user 1', role: 'admin' });

const app: Application = setUpApp(pagesV2Routes, (req, _res, next) => {
  (req as any).user = getUser();
  next();
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe.each(testConfigs)('Pages V2 HTTP routes - $name', ({ postgresPages }) => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true, postgresMirror: ['pages'] });
    testingTenants.changeCurrentTenant({ featureFlags: { postgresPages } });
    await testingPG.clear(['page_releases']);
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

  describe('POST /api/pages', () => {
    it('should validate with minimum required props', async () => {
      const response = await request(app)
        .post('/api/pages')
        .set('content-language', 'en')
        .send({ title: 'good structure' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('good structure');
    });

    it('should not validate with wrong structure', async () => {
      const response = await request(app).post('/api/pages').send({ withoutTitle: true });

      expect(response.status).toBe(422);
      expect(response.text).toContain('validation failed');
    });
  });

  describe('GET /api/pages', () => {
    it('should return the page for the current locale', async () => {
      const response = await request(app)
        .get('/api/pages')
        .query({ sharedId: '1' })
        .set('content-language', 'es');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Batman finishes');
    });
  });

  describe('GET /api/page', () => {
    it('should return the page for the current locale', async () => {
      const response = await request(app)
        .get('/api/page')
        .query({ sharedId: '1' })
        .set('content-language', 'es');

      expect(response.status).toBe(200);
      expect(response.body.sharedId).toBe('1');
      expect(response.body.title).toBe('Batman finishes');
    });

    it('should return 404 for an unknown page', async () => {
      const response = await request(app)
        .get('/api/page')
        .query({ sharedId: 'unexistent' })
        .set('content-language', 'es');

      expect(response.status).toBe(404);
    });

    it('should require a sharedId', async () => {
      const response = await request(app).get('/api/page').set('content-language', 'es');

      expect(response.status).toBe(422);
    });
  });

  describe('DELETE /api/pages', () => {
    it('should refuse to delete a page in use by templates', async () => {
      const response = await request(app).delete('/api/pages').query({ sharedId: '1' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('This page is in use by the following templates:');
    });

    it('should delete the page by sharedId', async () => {
      const response = await request(app).delete('/api/pages').query({ sharedId: '2' });

      expect(response.status).toBe(200);

      const getResponse = await request(app)
        .get('/api/page')
        .query({ sharedId: '2' })
        .set('content-language', 'es');
      expect(getResponse.status).toBe(404);
    });
  });
});
