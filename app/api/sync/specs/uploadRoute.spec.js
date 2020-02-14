import 'api/utils/jasmineHelpers';

import express from 'express';

import requestAPI from 'supertest';
import path from 'path';
import fs from 'fs';

import syncRoutes from '../routes.js';
import paths from '../../config/paths';

jest.mock('../../auth/authMiddleware.js', () => () => (_req, _res, next) => {
  next();
});

describe('sync', () => {
  describe('sync/upload', () => {
    it('should place document without changing name on /uploads', async () => {
      paths.uploadedDocuments = `${__dirname}/uploads/`;
      try {
        fs.unlinkSync(path.join(paths.uploadedDocuments, 'test.txt'));
      } catch (e) {
        //
      }
      const app = express();
      syncRoutes(app);

      const response = await requestAPI(app)
        .post('/api/sync/upload')
        .set('X-Requested-With', 'XMLHttpRequest')
        .attach('file', path.join(__dirname, 'test.txt'));

      const properlyUploaded = fs.existsSync(path.join(paths.uploadedDocuments, 'test.txt'));
      expect(response.status).toBe(200);
      expect(properlyUploaded).toBeTruthy();
    });
  });
});
