import request from 'supertest';
import express, { Application } from 'express';

import { requestIdMiddleware } from '#api/utils/requestIdMiddleware.js';

import { appContextMiddleware } from '#api/utils/appContextMiddleware.js';
import { appContext } from '#api/utils/AppContext.js';

const testingRoutes = (app: Application) => {
  app.get('/api/requestId', (_req, res, next) => {
    res.json(appContext.get('requestId'));
    next();
  });
};

describe('requestId middleware', () => {
  const app: Application = express();

  beforeAll(() => {
    app.use(appContextMiddleware);
    app.use(requestIdMiddleware);
    testingRoutes(app);
  });

  it('should set a requestId number as part of the context', async () => {
    const response = await request(app).get('/api/requestId');
    expect(response.text).toEqual(expect.stringMatching(/^[0-9]{1,4}$/));
  });
});
