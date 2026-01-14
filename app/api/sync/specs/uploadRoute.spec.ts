import express, { Express, NextFunction, Request, Response } from 'express';

import requestAPI from 'supertest';
import path from 'path';

import {
  customUploadsPath,
  deleteFile,
  setupTestUploadedPaths,
  storage,
} from '#api/files/index.js';

import { testingTenants } from '#api/utils/testingTenants.js';

import { multitenantMiddleware } from '#api/utils/multitenantMiddleware.js';

import { appContextMiddleware } from '#api/utils/appContextMiddleware.js';

import syncRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('sync', () => {
  describe('sync/upload', () => {
    beforeAll(async () => {
      testingTenants.mockCurrentTenant({});
      await setupTestUploadedPaths('sync');
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
        .attach('file', path.join(__dirname, 'testUpload.txt'));

      expect(response.status).toBe(200);
      expect(await storage.fileExists('testUpload.txt', 'document')).toBeTruthy();
    });

    it("should allow uploading collection's custom files", async () => {
      const response = await requestAPI(app)
        .post('/api/sync/upload/custom')
        .attach('file', path.join(__dirname, 'testUpload.txt'));

      expect(response.status).toBe(200);
      expect(await storage.fileExists('testUpload.txt', 'custom')).toBeTruthy();
    });
  });
});
