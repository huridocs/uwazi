import request from 'supertest';
import express, { Application } from 'express';
// @ts-expect-error TS(2307): Cannot find module '../tenants/tenantContext.js' o... Remove this comment to see the full error message
import { tenants } from '../tenants/tenantContext.js';
import { multitenantMiddleware } from '../multitenantMiddleware';
import { appContextMiddleware } from '../appContextMiddleware';

const testingRoutes = (app: Application) => {
  app.get('/api/testGET', (_req, res, next) => {
    res.json(tenants.current());
    next();
  });
};

describe('multitenant middleware', () => {
  it('should execute next middlewares inside a tenant async context', async () => {
    tenants.add({ name: 'test' });

    const app: Application = express();
    app.use(appContextMiddleware);
    app.use(multitenantMiddleware);
    testingRoutes(app);

    const response = await request(app).get('/api/testGET').set('tenant', 'test');

    expect(JSON.parse(response.text)).toMatchObject({ name: 'test' });
  });
});
