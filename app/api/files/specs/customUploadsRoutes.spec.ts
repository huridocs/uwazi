/** @format */

import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';
import db from 'api/utils/testing_db';

import { FileSchema } from '../fileType';

import { fixtures } from './fixtures';
import { files } from '../files';

import uploadRoutes from '../routes';
import { setUpApp } from './helpers';

jest.mock(
  '../../auth/authMiddleware.js',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('custom upload routes', () => {
  const app: Application = setUpApp(uploadRoutes);

  beforeEach(async () => db.clearAllAndLoad(fixtures));
  afterAll(async () => db.disconnect());

  describe('POST/customisation/upload', () => {
    it('should save the upload and return it', async () => {
      const response: SuperTestResponse = await request(app)
        .post('/api/files/upload/custom')
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
      const response: SuperTestResponse = await request(app).get('/api/customisation/upload');

      expect(response.body.map((file: FileSchema) => upload.originalname)).toEqual([
        'upload1',
        'upload2',
      ]);
    });
  });

  describe('DELETE/customisation/upload', () => {
    it('should delete upload and return the response', async () => {
      spyOn(files, 'delete').and.returnValue(Promise.resolve('upload_deleted'));
      const response: SuperTestResponse = await request(app)
        .delete('/api/customisation/upload')
        .query({ _id: 'upload_id' });

      expect(response.body).toBe('upload_deleted');
      expect(files.delete).toHaveBeenCalledWith('upload_id');
    });

    it('should validate _id as string', async () => {
      const response: SuperTestResponse = await request(app)
        .delete('/api/customisation/upload')
        .query({ _id: { test: 'test' } });

      expect(response.body.errors[0].message).toBe('should be string');
    });
  });
});
