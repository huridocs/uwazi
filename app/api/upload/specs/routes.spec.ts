/** @format */

// import fs from 'fs';
import path from 'path';
import request, { Response, Request } from 'supertest';
import express, { Application, NextFunction } from 'express';
import db from 'api/utils/testing_db';
import errorHandlingMiddleware from 'api/utils/error_handling_middleware';

import { UploadSchema } from '../uploadType';

import fixtures from './fixtures.js';
import uploads from '../uploads';

import uploadRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('upload routes', () => {
  const app: Application = express();
  uploadRoutes(app);
  app.use(errorHandlingMiddleware);

  beforeEach(async () => db.clearAllAndLoad(fixtures));

  afterAll(async () => db.disconnect());

  describe('POST/customisation/upload', () => {
    it('should save the upload and return it', async () => {
      const response: Response = await request(app)
        .post('/api/customisation/upload')
        .attach('file', path.join(__dirname, 'test.txt'));

      expect(response.body).toEqual(
        expect.objectContaining({
          type: 'custom',
          filename: expect.stringMatching(/.*\.txt/),
          mimetype: 'text/plain',
          originalname: 'test.txt',
          size: 5,
        })
      );
    });
  });

  describe('GET/customisation/upload', () => {
    it('should return all uploads', async () => {
      const response: Response = await request(app).get('/api/customisation/upload');

      expect(response.body.map((upload: UploadSchema) => upload.originalname)).toEqual([
        'upload1',
        'upload2',
      ]);
    });
  });

  describe('DELETE/customisation/upload', () => {
    it('should delete upload and return the response', async () => {
      spyOn(uploads, 'delete').and.returnValue(Promise.resolve('upload_deleted'));
      const response: Response = await request(app)
        .delete('/api/customisation/upload')
        .query({ _id: 'upload_id' });

      expect(response.body).toBe('upload_deleted');
      expect(uploads.delete).toHaveBeenCalledWith('upload_id');
    });

    it('should validate _id as string', async () => {
      const response: Response = await request(app)
        .delete('/api/customisation/upload')
        .query({ _id: { test: 'test' } });

      expect(response.body.errors[0].message).toBe('should be string');
    });
  });
});
