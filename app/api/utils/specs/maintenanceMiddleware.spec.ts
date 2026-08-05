import request from 'supertest';
import express, { Application } from 'express';
import { tenants } from '#api/tenants/tenantContext.js';
import { maintenanceMiddleware } from '../maintenanceMiddleware.js';
import { multitenantMiddleware } from '../multitenantMiddleware.js';
import { appContextMiddleware } from '../appContextMiddleware.js';

const testingRoutes = (app: Application) => {
  app.get('/api/testGET', (_req, res, next) => {
    res.json(tenants.current());
    next();
  });
};

describe('maintenance middleware', () => {
  it('should pass through when tenant is not in maintenance', async () => {
    tenants.add({ name: 'test' });

    const app: Application = express();
    app.use(appContextMiddleware);
    app.use(multitenantMiddleware);
    app.use(maintenanceMiddleware);
    testingRoutes(app);

    const response = await request(app).get('/api/testGET').set('tenant', 'test');

    expect(response.status).toBe(200);
  });

  it('should return 503 when tenant is in maintenance', async () => {
    tenants.add({ name: 'test', maintenance: true });

    const app: Application = express();
    app.use(appContextMiddleware);
    app.use(multitenantMiddleware);
    app.use(maintenanceMiddleware);
    testingRoutes(app);

    const response = await request(app).get('/api/testGET').set('tenant', 'test');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Service Unavailable', maintenance: true });
  });
});
