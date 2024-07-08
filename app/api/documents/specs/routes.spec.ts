import request, { Response as SuperTestResponse } from 'supertest';
import { Application, Request, Response, NextFunction } from 'express';

import db from 'api/utils/testing_db';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures, document1 } from './fixtures';

import { documentRoutes } from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('document routes', () => {
  const app: Application = setUpApp(documentRoutes);

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('GET/page', () => {
    it('should return raw page', async () => {
      let res: SuperTestResponse = await request(app)
        .get('/api/documents/page')
        .query({ _id: document1.toString(), page: 1 });

      expect(res.body).toEqual({ data: 'page 1' });

      res = await request(app)
        .get('/api/documents/page')
        .query({ _id: document1.toString(), page: 2 });

      expect(res.body).toEqual({ data: 'page 2' });
    });

    it('should return an error when pages does not exists', async () => {
      const res: SuperTestResponse = await request(app)
        .get('/api/documents/page')
        .query({ _id: document1.toString(), page: 9999 });

      expect(res.body).toEqual(
        expect.objectContaining({
          error: 'page does not exists',
        })
      );
    });

    it('should only accept numbers for page', async () => {
      const res: SuperTestResponse = await request(app)
        .get('/api/documents/page')
        .query({ _id: document1.toString(), page: 'not a number' });

      expect(res.status).toEqual(400);
    });

    it('should return error when file does not exists', async () => {
      const res: SuperTestResponse = await request(app)
        .get('/api/documents/page')
        .query({ _id: db.id().toString() });

      expect(res.body).toEqual(
        expect.objectContaining({
          error: 'document does not exists',
        })
      );
    });
  });
});
