import 'api/utils/jasmineHelpers';

import express, { Request, Response, NextFunction, Express } from 'express';

import requestAPI from 'supertest';
import path from 'path';

import {
  setupTestUploadedPaths,
  uploadsPath,
  customUploadsPath,
  deleteFile,
  fileExists,
} from 'api/files';
import { testingTenants } from 'api/utils/testingTenants';
import { multitenantMiddleware } from 'api/utils/multitenantMiddleware';
import { appContextMiddleware } from 'api/utils/appContextMiddleware';

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

    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(appContextMiddleware);
      app.use(multitenantMiddleware);
      syncRoutes(app);
    });

    afterEach(async () => {
      await deleteFile(uploadsPath('testUpload.txt'));
      await deleteFile(customUploadsPath('testUpload.txt'));
    });

    it('should place document without changing name on /uploads', async () => {
      const response = await requestAPI(app)
        .post('/api/sync/upload')
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('file', path.join(__dirname, 'testUpload.txt'));

      const properlyUploaded = await fileExists(uploadsPath('testUpload.txt'));
      expect(response.status).toBe(200);
      expect(properlyUploaded).toBeTruthy();
    });

    it('should allow setting the uploads destination according to type', async () => {
      const response = await requestAPI(app)
        .post('/api/sync/upload')
        .field('type', 'custom')
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('file', path.join(__dirname, 'testUpload.txt'));

      expect(response.status).toBe(200);

      expect(await fileExists(customUploadsPath('testUpload.txt'))).toBeTruthy();
    });
  });
});
