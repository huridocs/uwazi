import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { setUpApp } from 'api/utils/testingRoutes';

import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures, fileName1, uploadId } from './fixtures';

import uploadRoutes from '../routes';
import { files } from '../files';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('files routes download', () => {
  const app: Application = setUpApp(uploadRoutes);

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.disconnect());

  describe('GET/', () => {
    it('should send the file', async () => {
      const response: SuperTestResponse = await request(app)
        .get(`/api/files/${fileName1}`)
        .expect(200);

      expect(response.body instanceof Buffer).toBe(true);
    });

    it('should set the original filename as content-disposition header', async () => {
      const response: SuperTestResponse = await request(app)
        .get(`/api/files/${fileName1}`)
        .expect(200);

      expect(response.get('Content-Disposition')).toBe("filename*=UTF-8''upload1");
    });

    it('should properly uri encode original names', async () => {
      await files.save({ _id: uploadId, originalname: '테스트 한글chinese-file' });

      const response: SuperTestResponse = await request(app)
        .get(`/api/files/${fileName1}`)
        .expect(200);

      expect(response.get('Content-Disposition')).toBe(
        `filename*=UTF-8''${encodeURIComponent('테스트 한글chinese-file')}`
      );
    });

    it('should not set content-disposition header when the file does not have an original name', async () => {
      const response: SuperTestResponse = await request(app)
        .get('/api/files/fileNotInDisk')
        .expect(404);

      expect(response.get('Content-Disposition')).toBeUndefined();
    });

    describe('when file entry does not exist', () => {
      it('should respond with 404', async () => {
        const response = await request(app)
          .get('/api/files/unexistent.pdf')
          .query({ _id: testingDB.id().toString() });

        expect(response.status).toBe(404);
      });
    });

    describe('when disk file does not exist', () => {
      it('should respond with 404', async () => {
        const response = await request(app)
          .get('/api/files/fileNotOnDisk')
          .query({ _id: testingDB.id().toString() });

        expect(response.status).toBe(404);
      });
    });
  });
});
