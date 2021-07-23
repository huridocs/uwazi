import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import { appContextMiddleware } from '../appContextMiddleware';
import { appContext } from '../AppContext';

const testingRoutes = (app: Application) => {
  app.get('/api/testGET', (_req, res, next) => {
    res.json(appContext.get('someKey'));
    next();
  });
  app.get('/api/requestId', (_req, res, next) => {
    res.json(appContext.get('requestId'));
    next();
  });
};

const helperMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  appContext.set('someKey', req.get('someHeader'));
  next();
};

describe('appcontext middleware', () => {
  const app: Application = express();

  beforeAll(() => {
    app.use(appContextMiddleware);
    app.use(helperMiddleware);
    testingRoutes(app);
  });

  it('should execute next middlewares inside an async context', async () => {
    const response = await request(app)
      .get('/api/testGET')
      .set('someHeader', 'test');

    expect(response.text).toBe(JSON.stringify('test'));
  });

  it('should set a requestId number as part of the context', async () => {
    const response = await request(app).get('/api/requestId');
    expect(response.text).toEqual(expect.stringMatching(/^[0-9]{1,4}$/));
  });
});
