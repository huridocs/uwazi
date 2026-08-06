import type { Application } from 'express';
import { ObjectId } from 'mongodb';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { CaptchaController } from '../CaptchaController.js';

const getRoute = (app: Application) => {
  app.get('/api/captcha', CaptchaController.createHandler());
};

describe('CaptchaController integration', () => {
  const app: Application = setUpApp(getRoute);

  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return an svg and an id, and persist the captcha text under that id', async () => {
    const response = await request(app).get('/api/captcha');

    expect(response).toHaveStatus(200);
    expect(response.body.svg).toContain('<svg');
    expect(response.body.id).toBeDefined();

    const stored = await getConnection()
      .collection('captchas')
      .findOne({ _id: new ObjectId(response.body.id) });
    expect(stored?.text).toHaveLength(4);
  });
});
