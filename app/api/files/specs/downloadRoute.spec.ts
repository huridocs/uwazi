import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import { setUpApp } from 'api/utils/testingRoutes';
import db from 'api/utils/testing_db';

import { fixtures, fileName1 } from './fixtures';

import uploadRoutes from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('files routes download', () => {
  const app: Application = setUpApp(uploadRoutes);

  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('GET/', () => {
    it('should send the file the file', async () => {
      const response: SuperTestResponse = await request(app).get(`/api/files/${fileName1}`);

      expect(response.header['content-disposition']).not.toBeDefined();
      expect(response.body instanceof Buffer).toBe(true);
    });

    describe('when file entry does not exist', () => {
      it('should respond with 404', async () => {
        const response = await request(app)
          .get('/api/files/unexistent.pdf')
          .query({ _id: db.id().toString() });

        expect(response.status).toBe(404);
      });
    });

    describe('when disk file does not exist', () => {
      it('should respond with 404', async () => {
        const response = await request(app)
          .get('/api/files/fileNotOnDisk')
          .query({ _id: db.id().toString() });

        expect(response.status).toBe(404);
      });
    });
  });
});
