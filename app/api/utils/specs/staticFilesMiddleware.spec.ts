import request from 'supertest';
import express, { Application } from 'express';
import { setupTestUploadedPaths, uploadsPath, writeFile } from 'api/files';
import { staticFilesMiddleware } from '../staticFilesMiddleware';
import { testingTenants } from '../testingTenants';

describe('multitenant middleware', () => {
  beforeEach(() => {
    testingTenants.mockCurrentTenant({ name: 'default' });
    setupTestUploadedPaths();
  });

  it('should execute next middlewares inside a tenant async context', async () => {
    const app: Application = express();
    app.get('/static-files/:fileName', staticFilesMiddleware(uploadsPath));

    await writeFile(uploadsPath('staticFilesMiddleware.extension'), 'test text');

    const response = await request(app)
      .get('/static-files/staticFilesMiddleware.extension')
      .expect(200);

    expect(response.body instanceof Buffer).toBe(true);
    expect(response.body.toString()).toBe('test text');
  });
});
