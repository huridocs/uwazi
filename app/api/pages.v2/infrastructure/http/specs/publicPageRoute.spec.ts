import request from 'supertest';
import type { Application } from 'express';
import settings from '#api/settings/settings.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { fixtures } from '#api/pages/specs/fixtures.js';
import { User } from '#api/users.v2/model/User.js';
import { pagesV2Routes } from '../routes.js';
import { PagesDataSourceFactory } from '../../factories/PagesDataSourceFactory.js';

const app: Application = setUpApp(pagesV2Routes);

describe('public page embed route', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return published page content for anonymous users on a public instance', async () => {
    const response = await request(app)
      .get('/api/public/page')
      .query({ sharedId: '1' })
      .set('content-language', 'en')
      .expect(200);

    expect(response.body.sharedId).toBe('1');
    expect(response.body.metadata?.content).toBeDefined();
  });

  it('should reject anonymous access on a private instance when embedPublic is false', async () => {
    const current = await settings.get();
    await settings.save({ ...current, private: true });

    const response = await request(app)
      .get('/api/public/page')
      .query({ sharedId: '1' })
      .set('content-language', 'en')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');

    await settings.save({ ...current, private: false });
  });

  it('should allow anonymous access on a private instance when embedPublic is true', async () => {
    const current = await settings.get();
    await settings.save({ ...current, private: true });

    await testingEnvironment.runWithContext(async () => {
      const pagesDS = PagesDataSourceFactory.default();
      const page = (await pagesDS.getBySharedId('1')).getDataOrThrow();
      page.embedPublic = true;
      await pagesDS.update(page);
    });

    const response = await request(app)
      .get('/api/public/page')
      .query({ sharedId: '1' })
      .set('content-language', 'en')
      .expect(200);

    expect(response.body.sharedId).toBe('1');

    await settings.save({ ...current, private: false });
  });

  it('should allow authenticated users on a private instance without embedPublic', async () => {
    const current = await settings.get();
    await settings.save({ ...current, private: true });

    const authedApp = setUpApp(pagesV2Routes, (req, _res, next) => {
      req.user = User.createFrom({ _id: 'adminUser', role: 'admin' });
      next();
    });

    const response = await request(authedApp)
      .get('/api/public/page')
      .query({ sharedId: '1' })
      .set('content-language', 'en')
      .expect(200);

    expect(response.body.sharedId).toBe('1');

    await settings.save({ ...current, private: false });
  });
});
