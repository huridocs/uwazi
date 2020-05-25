import 'api/utils/jasmineHelpers';

import express, { Request, Response, NextFunction } from 'express';

import requestAPI from 'supertest';
import path from 'path';
import fs from 'fs';

import { setupTestUploadedPaths, uploadsPath, deleteFile } from 'api/files';
import { testingTenants } from 'api/utils/testingTenants';
import { multitenantMiddleware } from 'api/utils/multitenantMiddleware';

import syncRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('sync', () => {
  describe('sync/upload', () => {
    beforeAll(() => {
      testingTenants.mockCurrentTenant({});
      setupTestUploadedPaths();
    });

    afterAll(() => {
      testingTenants.restoreCurrentFn();
    });

    it('should place document without changing name on /uploads', async () => {
      await deleteFile(uploadsPath('testUpload.txt'));

      const app = express();
      app.use(multitenantMiddleware);
      syncRoutes(app);

      const response = await requestAPI(app)
        .post('/api/sync/upload')
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('file', path.join(__dirname, 'testUpload.txt'));

      const properlyUploaded = fs.existsSync(uploadsPath('testUpload.txt'));
      expect(response.status).toBe(200);
      expect(properlyUploaded).toBeTruthy();
    });
  });
});
