import request from 'supertest';
import express, { Application } from 'express';
import { tenants } from 'api/tenants/tenantContext';
import { multitenantMiddleware } from '../multitenantMiddleware';
import { errorHandlingMiddleware } from '../errorHandlingMiddleware';
import { config } from 'api/config';

const testingRoutes = (app: Application) => {
  app.get('/api/testGET', (_req, res, next) => {
    res.json(tenants.current());
    next();
  });
};

describe('multitenant middleware', () => {
  const app: Application = express();

  beforeAll(() => {
    app.use(multitenantMiddleware);
    app.use(errorHandlingMiddleware);
    config.version = 'version';
    testingRoutes(app);
    //@ts-ignore
    tenants.add({ name: 'unavailable tenant', unavailable: true, uwaziVersion: 'version' });
    //@ts-ignore
    tenants.add({ name: 'unmatched version tenant', uwaziVersion: 'not the proper version' });
    //@ts-ignore
    tenants.add({ name: 'test', uwaziVersion: 'version' });
  });

  it('should execute next middlewares inside a tenant async context', async () => {
    const response = await request(app)
      .get('/api/testGET')
      .set('tenant', 'test');

    expect(response.text).toBe(JSON.stringify({ name: 'test', uwaziVersion: 'version' }));
  });

  describe('when tenant is unavailable', () => {
    it('should respond with a 503 status code', async () => {
      const response = await request(app)
        .get('/api/testGET')
        .set('tenant', 'unavailable tenant');

      expect(response.status).toBe(503);
    });
  });

  describe('when the version of the app does not match tenant version', () => {
    it('should respond with a 502 status code', async () => {
      const response = await request(app)
        .get('/api/testGET')
        .set('tenant', 'unmatched version tenant');

      expect(response.status).toBe(502);
    });
  });
});
