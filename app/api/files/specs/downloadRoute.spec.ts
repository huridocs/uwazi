import request from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import db from 'api/utils/testing_db';

import { fixtures, uploadId } from './fixtures';

import uploadRoutes from '../routes';
import paths from '../../config/paths';
import { setUpApp } from './helpers';

jest.mock(
  '../../auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('upload routes', () => {
  const app: Application = setUpApp(uploadRoutes);

  beforeEach(async () => {
    paths.uploadedDocuments = `${__dirname}/uploads/`;
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('GET/download', () => {
    it('should download the file', async () => {
      const response = await request(app)
        .get('/api/files/download')
        .query({ _id: uploadId.toString() });

      expect(response.body instanceof Buffer).toBe(true);
    });

    describe('when file does not exist', () => {
      it('should respond with 404', async () => {
        const response = await request(app)
          .get('/api/files/download')
          .query({ _id: db.id().toString() });

        expect(response.status).toBe(404);
      });
    });
  });
});
