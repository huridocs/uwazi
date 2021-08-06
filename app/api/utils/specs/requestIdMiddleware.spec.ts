import request from 'supertest';
import express, { Application } from 'express';
import { requestIdMiddleware } from 'api/utils/requestIdMiddleware';
import { appContextMiddleware } from 'api/utils/appContextMiddleware';
import { appContext } from '../AppContext';

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
